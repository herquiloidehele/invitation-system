import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  appendCanvaProxyHideScrollbarFlag,
  hasRichExternalSections,
  isInitialCanvaEmbedPage,
  resolveCanvaEmbedPageState,
  shouldPreloadRichExternalCanva,
  shouldShowRichExternalRsvp,
  shouldShowVideoEntranceInitialSections
} from "../lib/external-invitation-form";
import type { InvitationData } from "../lib/types";

function baseExternalInvitation(
  overrides: Partial<InvitationData> = {},
): InvitationData {
  return {
    slug: "ana-bruno",
    themeId: "theme_pink",
    template: "pink-floral",
    couple: { bride: "Ana", groom: "Bruno", monogram: "A&B" },
    date: {
      iso: "",
      display: "",
      dayOfWeek: "",
      time: "",
      day: "",
      month: "",
      year: "",
    },
    quote: "",
    location: { name: "", address: "", googleMapsUrl: "" },
    rsvp: { enabled: false, showOnExternalPage: false },
    schedule: [],
    dressCode: { enabled: false, text: "" },
    giftRegistry: { enabled: false, text: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "",
    videoUrl: "",
    eventType: "wedding",
    invitationType: "external_link",
    externalLink: "https://example.com/invite",
    faqs: [],
    places: { enabled: false, layout: "stacked", sections: [] },
    ...overrides,
  } as InvitationData;
}

describe("hasRichExternalSections", () => {
  const renderableCases: Array<[string, Partial<InvitationData>]> = [
    [
      "gallery",
      {
        coupleGallery: {
          enabled: true,
          style: "grid",
          images: [{ src: "gallery.jpg" }],
        },
      },
    ],
    ["gifts", { giftRegistry: { enabled: true, text: "" } }],
    ["faqs", { faqs: [{ question: "Q", answer: "A" }] }],
    [
      "places",
      {
        places: {
          enabled: true,
          layout: "stacked",
          sections: [
            {
              id: "hotels",
              title: "Hotels",
              items: [{ id: "hotel", title: "Hotel" }],
            },
          ],
        },
      },
    ],
  ];

  it.each(renderableCases)("uses rich layout for %s", (_name, overrides) => {
    expect(hasRichExternalSections(baseExternalInvitation(overrides))).toBe(
      true,
    );
  });

  const emptyCases: Array<Partial<InvitationData>> = [
    { coupleGallery: { enabled: true, style: "grid", images: [] } },
    { giftRegistry: { enabled: false, text: "" } },
    { faqs: [] },
    { places: { enabled: true, layout: "stacked", sections: [] } },
  ];

  it.each(emptyCases)(
    "does not activate rich layout for empty optional content: %j",
    (overrides) => {
      expect(hasRichExternalSections(baseExternalInvitation(overrides))).toBe(
        false,
      );
    },
  );
});

describe("shared FAQ section source", () => {
  it("keeps FAQ rendering editable and stateful", () => {
    const source = readFileSync(
      join(process.cwd(), "components/shared/FaqSection.tsx"),
      "utf8",
    );

    expect(source).toContain("EditableCard");
    expect(source).toContain("EditableText");
    expect(source).toContain("sectionTitle_faqs");
    expect(source).toContain("openFaqIndex");
  });
});

describe("rich external section composition source", () => {
  it("composes rich external sections after Canva in the approved order", () => {
    const source = readFileSync(
      join(process.cwd(), "components/shared/RichExternalLinkPage.tsx"),
      "utf8",
    );

    for (const name of [
      "CanvaEmbed",
      "CoupleGallery",
      "GiftsSection",
      "FaqSection",
      "PlacesSection",
      "RSVPForm",
    ]) {
      expect(source).toContain(name);
    }

    expect(source.indexOf("<CanvaEmbed")).toBeLessThan(
      source.indexOf("<CoupleGallery"),
    );
    expect(source.indexOf("<CoupleGallery")).toBeLessThan(
      source.indexOf("<GiftsSection"),
    );
    expect(source.indexOf("<GiftsSection")).toBeLessThan(
      source.indexOf("<FaqSection"),
    );
    expect(source.indexOf("<FaqSection")).toBeLessThan(
      source.indexOf("<PlacesSection"),
    );
    expect(source.indexOf("<PlacesSection")).toBeLessThan(
      source.indexOf("<RSVPForm"),
    );
  });
});

describe("external invitation editor source", () => {
  it("exposes full optional-section editing in the external form", () => {
    const source = readFileSync(
      join(process.cwd(), "app/admin/invitations/ExternalInvitationForm.tsx"),
      "utf8",
    );

    for (const token of [
      "CoupleGalleryEditor",
      "GiftsListEditor",
      "BankTransferEditor",
      "addFaq",
      "updateFaq",
      "removeFaq",
      "form.cardStyles",
      "form.spacingStyles",
      "updateSectionSpacing",
      "externalVideoDateIso",
      "externalVideoTime",
    ]) {
      expect(source).toContain(token);
    }
  });
});

describe("isInitialCanvaEmbedPage", () => {
  const initial = "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1";

  it("returns true for the original Canva embed URL", () => {
    expect(isInitialCanvaEmbedPage(initial, initial)).toBe(true);
  });

  it("returns false for Canva page hash navigation", () => {
    expect(
      isInitialCanvaEmbedPage(
        "/canva-proxy/brindealstudio.com/sara-e-hugo/?disableScroll=1#page-0",
        initial,
      ),
    ).toBe(false);
  });

  it("returns false for Canva page path navigation", () => {
    expect(
      isInitialCanvaEmbedPage(
        "/canva-proxy/brindealstudio.com/sara-e-hugo/page-2?disableScroll=1",
        initial,
      ),
    ).toBe(false);
  });
});

describe("appendCanvaProxyHideScrollbarFlag", () => {
  it("adds hideScrollbar=1 to a bare proxy src", () => {
    expect(
      appendCanvaProxyHideScrollbarFlag(
        "/canva-proxy/brindealstudio.com/sara-e-hugo",
      ),
    ).toBe("/canva-proxy/brindealstudio.com/sara-e-hugo?hideScrollbar=1");
  });

  it("preserves existing query params and the hash", () => {
    expect(
      appendCanvaProxyHideScrollbarFlag(
        "/canva-proxy/brindealstudio.com/sara-e-hugo?foo=bar#page-1",
      ),
    ).toBe(
      "/canva-proxy/brindealstudio.com/sara-e-hugo?foo=bar&hideScrollbar=1#page-1",
    );
  });

  it("is idempotent — does not duplicate the flag", () => {
    const once = appendCanvaProxyHideScrollbarFlag(
      "/canva-proxy/brindealstudio.com/sara-e-hugo",
    );
    expect(appendCanvaProxyHideScrollbarFlag(once)).toBe(once);
  });

  it("leaves non-proxy srcs untouched (we don't control their HTML)", () => {
    expect(
      appendCanvaProxyHideScrollbarFlag("https://example.com/some-invite"),
    ).toBe("https://example.com/some-invite");
    expect(appendCanvaProxyHideScrollbarFlag("")).toBe("");
  });
});

describe("shouldShowRichExternalRsvp", () => {
  it("shows RSVP only when RSVP is enabled and the original Canva page is active", () => {
    expect(
      shouldShowRichExternalRsvp({ rsvpOn: true, isInitialCanvaPage: true }),
    ).toBe(true);
    expect(
      shouldShowRichExternalRsvp({ rsvpOn: true, isInitialCanvaPage: false }),
    ).toBe(false);
    expect(
      shouldShowRichExternalRsvp({ rsvpOn: false, isInitialCanvaPage: true }),
    ).toBe(false);
  });
});

describe("shouldShowVideoEntranceInitialSections", () => {
  it("shows initial-only sections before iframe navigation", () => {
    expect(
      shouldShowVideoEntranceInitialSections({ isInitialCanvaPage: true }),
    ).toBe(true);
  });

  it("hides initial-only sections while iframe is on a non-initial page", () => {
    expect(
      shouldShowVideoEntranceInitialSections({ isInitialCanvaPage: false }),
    ).toBe(false);
  });
});

describe("resolveCanvaEmbedPageState", () => {
  const externalLink = "https://brindealstudio.com/sara-e-hugo";
  const initial = "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1";

  it("clears the navigated iframe src when browser Back restores the original iframe document", () => {
    expect(
      resolveCanvaEmbedPageState({
        actualSrc:
          "http://localhost:3000/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1",
        externalLink,
        initialSrc: initial,
      }),
    ).toEqual({
      isInitialPage: true,
      navigatedProxiedUrl: null,
    });
  });

  it("keeps a navigated iframe src when browser Forward restores a Canva subpage", () => {
    expect(
      resolveCanvaEmbedPageState({
        actualSrc:
          "http://localhost:3000/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
        externalLink,
        initialSrc: initial,
      }),
    ).toEqual({
      isInitialPage: false,
      navigatedProxiedUrl: {
        externalLink,
        src: "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
      },
    });
  });

  it("preserves the requested iframe src when browser Back restores the original iframe document", () => {
    const currentNavigatedProxiedUrl = {
      externalLink,
      src: "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
    };

    expect(
      resolveCanvaEmbedPageState({
        actualSrc:
          "http://localhost:3000/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1",
        currentNavigatedProxiedUrl,
        externalLink,
        initialSrc: initial,
      }),
    ).toEqual({
      isInitialPage: true,
      navigatedProxiedUrl: currentNavigatedProxiedUrl,
    });
  });

  it("normalizes absolute iframe URLs from any deployment domain", () => {
    expect(
      resolveCanvaEmbedPageState({
        actualSrc:
          "https://convites.example.com/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
        externalLink,
        initialSrc: initial,
      }),
    ).toEqual({
      isInitialPage: false,
      navigatedProxiedUrl: {
        externalLink,
        src: "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
      },
    });
  });
});

describe("external invitation helper source", () => {
  it("does not hardcode a localhost URL base", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/external-invitation-form.ts"),
      "utf8",
    );

    expect(source).not.toContain("localhost");
  });

  it("forwards scratch reveal background image props in the rich external page", () => {
    const source = readFileSync(
      join(process.cwd(), "components/shared/RichExternalLinkPage.tsx"),
      "utf8",
    );

    expect(source).toContain(
      "backgroundImageUrl={invitation.scratchReveal?.backgroundImageUrl}",
    );
    expect(source).toContain(
      "scrimOpacity={invitation.scratchReveal?.scrimOpacity}",
    );
    expect(source).toContain("imageSettings={invitation.imageSettings}");
  });

  it("offers both ScratchDateReveal shape options in both admin sections", () => {
    const source = readFileSync(
      join(process.cwd(), "app/admin/invitations/ExternalInvitationForm.tsx"),
      "utf8",
    );

    expect(source.match(/Quadrado arredondado/g)).toHaveLength(2);
    expect(source.match(/updateScratchRevealField\(\s*"shape"/g)).toHaveLength(
      2,
    );
    expect(source.match(/resolveScratchRevealShape\(/g)).toHaveLength(2);
  });

  it("forwards ScratchDateReveal shape through both rich page renderers", () => {
    const richSource = readFileSync(
      join(process.cwd(), "components/shared/RichExternalLinkPage.tsx"),
      "utf8",
    );
    const revealableSource = readFileSync(
      join(process.cwd(), "components/shared/RevealableExternalSections.tsx"),
      "utf8",
    );

    expect(richSource).toContain("shape={invitation.scratchReveal?.shape}");
    expect(revealableSource).toContain(
      "shape={invitation.scratchReveal?.shape}",
    );
  });
});

describe("shouldPreloadRichExternalCanva", () => {
  it("preloads off-viewport until the rich external page is visible", () => {
    expect(
      shouldPreloadRichExternalCanva({ isPreview: false, isVisible: false }),
    ).toBe(true);
    expect(
      shouldPreloadRichExternalCanva({ isPreview: false, isVisible: true }),
    ).toBe(false);
  });

  it("does not preload off-viewport in admin preview", () => {
    expect(
      shouldPreloadRichExternalCanva({ isPreview: true, isVisible: false }),
    ).toBe(false);
  });
});
