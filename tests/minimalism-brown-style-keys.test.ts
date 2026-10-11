import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

// The gift registry's router comes from Next's app router, which does not
// exist in this node-only run.
vi.mock("@/i18n/routing", () => ({ useRouter: () => ({}) }));

import CeremonyInfo from "@/components/minimalism-brown/CeremonyInfo";
import DressCode from "@/components/minimalism-brown/DressCode";
import GiftBox from "@/components/minimalism-brown/GiftBox";
import Guestbook from "@/components/minimalism-brown/Guestbook";
import OptionalSections from "@/components/minimalism-brown/OptionalSections";
import PhotoGallery from "@/components/minimalism-brown/PhotoGallery";
import ReceptionInfo from "@/components/minimalism-brown/ReceptionInfo";
import RsvpSection from "@/components/minimalism-brown/RsvpSection";
import Schedule from "@/components/minimalism-brown/Schedule";
import TransportInfo from "@/components/minimalism-brown/TransportInfo";
import VenueCard from "@/components/minimalism-brown/VenueCard";
import { InlineTextEditProvider } from "@/components/shared/EditableText";
import { SpacingStyleProvider } from "@/components/shared/SpacingStyleProvider";
import { toAdminInvitationInitialData } from "@/lib/invitation-admin-initial-data";
import { toInvitationData } from "@/lib/invitations";
import { MB_SECTION_TITLE_KEYS, mbVenues } from "@/lib/minimalism-brown";
import type {
  InvitationData,
  SpacingStyleOverrides,
  TemplateTheme,
  TextStyle,
  TextStyleOverrides,
} from "@/lib/types";
import messages from "@/messages/pt.json";
import {
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";

const theme = sourceTheme as unknown as TemplateTheme;

type SectionProps = { invitation: InvitationData; theme: TemplateTheme };

/** A provider whose children go in as createElement arguments, not props. */
type Wrapper<P> = ComponentType<Omit<P, "children"> & { children?: ReactNode }>;
const IntlProvider = NextIntlClientProvider as Wrapper<
  ComponentProps<typeof NextIntlClientProvider>
>;
const StyleProvider = SpacingStyleProvider as Wrapper<
  ComponentProps<typeof SpacingStyleProvider>
>;
const EditorProvider = InlineTextEditProvider as Wrapper<
  ComponentProps<typeof InlineTextEditProvider>
>;

/** The sections whose texts are covered here, in page order. OptionalSections
 *  holds four headings: countdown, our story, guest guide and FAQs. The venue
 *  cards are rendered after them, one per location. */
const SECTIONS = [
  CeremonyInfo,
  PhotoGallery,
  ReceptionInfo,
  TransportInfo,
  DressCode,
  Schedule,
  Guestbook,
  GiftBox,
  OptionalSections,
  RsvpSection,
] as ComponentType<SectionProps>[];

/** The sections, rendered the way the page does: one after another, inside
 *  the provider that carries spacing and visibility to the public page. */
function renderSections(
  textStyles: TextStyleOverrides,
  spacingStyles: SpacingStyleOverrides | null = null,
  { editor = false } = {},
): string {
  const invitation = toInvitationData({
    ...sourceInvitationRow,
    guestbook: { enabled: true },
    location2: { name: "Salão Nobre", address: "Porto" },
    textStyles,
    spacingStyles,
  });
  const props = {
    invitation,
    theme,
    wishes: [
      {
        id: "w1",
        guestName: "Rita",
        message: "Parabéns!",
        submittedAt: new Date("2027-01-01T12:00:00Z"),
      },
    ],
  };
  const sections = createElement(
    StyleProvider,
    {
      spacingStyles: invitation.spacingStyles,
      textStyles: invitation.textStyles,
    },
    ...SECTIONS.map((Section, i) =>
      createElement(Section, { key: i, ...props }),
    ),
    ...mbVenues(invitation).map((venue, index) =>
      createElement(VenueCard, {
        key: `venue-${index}`,
        invitation,
        theme,
        venue,
        index,
      }),
    ),
  );
  return renderToStaticMarkup(
    createElement(
      IntlProvider,
      { locale: "pt", messages, timeZone: "Europe/Lisbon" },
      // The admin preview wraps the page in this provider, which is what
      // turns each text into a selectable element.
      editor
        ? createElement(
            EditorProvider,
            {
              updateTextStyleElement: () => undefined,
              textStyles: invitation.textStyles,
            },
            sections,
          )
        : sections,
    ),
  );
}

function count(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

describe("minimalism-brown section heading styles", () => {
  it("styles each heading from its own key and no other", () => {
    // A size no base style uses, different for every heading.
    const elements: Record<string, TextStyle> = {};
    MB_SECTION_TITLE_KEYS.forEach((key, i) => {
      elements[key] = { fontSize: 101 + i };
    });

    const html = renderSections({ elements });

    for (const [key, style] of Object.entries(elements)) {
      expect([key, count(html, `font-size:${style.fontSize}px`)]).toEqual([
        key,
        1,
      ]);
    }
  });

  it("styles the dress-code line on its own, apart from the headings", () => {
    const html = renderSections({
      elements: {
        mbDressCodeText: { color: "#123456", fontSize: 97 },
        mbTitleDressCode: { color: "#654321" },
      },
    });

    expect(html).toMatch(
      /<p style="[^"]*font-size:97px[^"]*color:#123456[^"]*">Formal<\/p>/,
    );
    expect(count(html, "color:#654321")).toBe(1);
  });

  it("keeps an invitation styled through the old shared key looking the same", () => {
    const html = renderSections(
      { elements: { mbSectionTitle: { fontSize: 99 } } },
      { elements: { mbSectionTitle: { spaceBefore: 37 } } },
    );

    expect(count(html, "font-size:99px")).toBe(MB_SECTION_TITLE_KEYS.length);
    // Every heading, plus the dress-code line the old key also spaced.
    expect(count(html, "margin-top:37px")).toBe(
      MB_SECTION_TITLE_KEYS.length + 1,
    );
  });
});

describe("minimalism-brown reception title and venue names", () => {
  it("styles the reception title and each venue name from its own key", () => {
    const html = renderSections({
      elements: {
        mbReceptionIntro: { fontSize: 91 },
        mbVenueName: { fontSize: 92 },
        mbVenue2Name: { fontSize: 93 },
      },
    });

    expect(html).toMatch(
      /<p style="[^"]*font-size:91px[^"]*">A receção terá lugar em:<\/p>/,
    );
    expect(html).toMatch(/<h3 style="[^"]*font-size:92px[^"]*">Quinta<\/h3>/);
    expect(html).toMatch(
      /<h3 style="[^"]*font-size:93px[^"]*">Salão Nobre<\/h3>/,
    );
    for (const size of [91, 92, 93]) {
      expect([size, count(html, `font-size:${size}px`)]).toEqual([size, 1]);
    }
  });

  it("keeps venue names styled through the old shared key looking the same", () => {
    const html = renderSections({
      elements: { mbVenueLine: { fontSize: 94 } },
    });

    // Both venue names followed the shared key; the reception title never did.
    expect(count(html, "font-size:94px")).toBe(2);
  });

  it("makes each of them selectable on its own in the editor", () => {
    const html = renderSections({}, null, { editor: true });
    const keys = [...html.matchAll(/data-text-element="([^"]+)"/g)].map(
      (m) => m[1],
    );

    for (const key of ["mbReceptionIntro", "mbVenueName", "mbVenue2Name"]) {
      expect([key, keys.filter((k) => k === key).length]).toEqual([key, 1]);
    }
    expect(keys).not.toContain("mbVenueLine");
  });
});

describe("minimalism-brown countdown subtitle", () => {
  it("is styled from its own key", () => {
    const html = renderSections({
      elements: { mbCountdownSubtitle: { fontSize: 95, color: "#123456" } },
    });

    expect(html).toMatch(
      /<p style="[^"]*font-size:95px[^"]*color:#123456[^"]*">Até ao nosso grande dia<\/p>/,
    );
    expect(count(html, "font-size:95px")).toBe(1);
  });

  it("is selectable in the editor", () => {
    expect(renderSections({}, null, { editor: true })).toMatch(
      /data-text-element="mbCountdownSubtitle"[^>]*>Até ao nosso grande dia</,
    );
  });
});

describe("minimalism-brown headings in the inline editor", () => {
  const html = () => renderSections({}, null, { editor: true });
  const selectable = (markup: string) =>
    [...markup.matchAll(/data-text-element="([^"]+)"/g)].map((m) => m[1]);

  it("makes each heading selectable on its own", () => {
    const keys = selectable(html());

    for (const key of MB_SECTION_TITLE_KEYS) {
      expect([key, keys.filter((k) => k === key).length]).toEqual([key, 1]);
    }
    expect(keys).not.toContain("mbSectionTitle");
  });

  it("selects the dress-code line apart from its heading", () => {
    expect(html()).toMatch(/data-text-element="mbDressCodeText"[^>]*>Formal</);
  });
});

describe("loading an invitation styled before the heading split", () => {
  const row = {
    ...sourceInvitationRow,
    textStyles: { elements: { mbSectionTitle: { fontSize: 22 } } },
    spacingStyles: { elements: { mbSectionTitle: { spaceAfter: 6 } } },
  };

  it("splits the shared key for the public page", () => {
    const invitation = toInvitationData(row);

    expect(invitation.textStyles?.elements?.mbSectionTitle).toBeUndefined();
    expect(invitation.textStyles?.elements?.mbTitleSchedule).toEqual({
      fontSize: 22,
    });
    expect(invitation.spacingStyles?.elements?.mbSectionTitle).toBeUndefined();
    expect(invitation.spacingStyles?.elements?.mbTitleSchedule).toEqual({
      spaceAfter: 6,
    });
  });

  it("splits the shared key for the admin form, so a save stores the split", () => {
    const initial = toAdminInvitationInitialData(row);

    expect(initial.textStyles?.elements?.mbSectionTitle).toBeUndefined();
    expect(initial.textStyles?.elements?.mbTitleGifts).toEqual({
      fontSize: 22,
    });
    expect(initial.spacingStyles?.elements?.mbSectionTitle).toBeUndefined();
    expect(initial.spacingStyles?.elements?.mbDressCodeText).toEqual({
      spaceAfter: 6,
    });
  });
});
