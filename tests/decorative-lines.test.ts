import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  SectionDivider,
  SectionTitleUnderline,
} from "@/components/shared/DecorativeLines";
import PlacesSection from "@/components/shared/PlacesSection";
import { toInvitationData } from "@/lib/invitations";
import type { TemplateTheme } from "@/lib/types";
import {
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";
import pt from "../messages/pt.json";

const DECORATIVE = "#123456";
const ACCENT = "#654321";
const theme = {
  ...(sourceTheme as unknown as TemplateTheme),
  decorativeColor: DECORATIVE,
  accent: ACCENT,
};

type TestIntlProviderProps = Omit<
  ComponentProps<typeof NextIntlClientProvider>,
  "children"
> & { children?: ReactNode };
const TestIntlProvider =
  NextIntlClientProvider as ComponentType<TestIntlProviderProps>;

function renderWithIntl(element: ReactElement): string {
  return renderToStaticMarkup(
    createElement(
      TestIntlProvider,
      { locale: "pt", messages: pt, timeZone: "Europe/Lisbon" },
      element,
    ),
  );
}

describe("SectionDivider", () => {
  it("draws the gold lines by default", () => {
    const html = renderToStaticMarkup(createElement(SectionDivider, { theme }));

    expect(html).toContain(`background:${DECORATIVE}`);
  });

  it("renders nothing when decorative lines are hidden", () => {
    const html = renderToStaticMarkup(
      createElement(SectionDivider, { theme, show: false }),
    );

    expect(html).toBe("");
  });
});

describe("SectionTitleUnderline", () => {
  it("draws the accent underline by default", () => {
    const html = renderToStaticMarkup(
      createElement(SectionTitleUnderline, { color: ACCENT }),
    );

    expect(html).toContain(`background:${ACCENT}`);
  });

  it("keeps the title spacing but drops the line when hidden", () => {
    const html = renderToStaticMarkup(
      createElement(SectionTitleUnderline, { color: ACCENT, show: false }),
    );

    expect(html).toContain("mt-3 mb-6");
    expect(html).not.toContain(ACCENT);
  });
});

describe("PlacesSection decorative lines", () => {
  const places = {
    enabled: true,
    layout: "stacked" as const,
    sections: [
      { id: "s1", title: "Hotéis", items: [{ id: "p1", title: "Hotel A" }] },
    ],
  };

  function renderPlaces(showDecorativeLines?: boolean): string {
    return renderWithIntl(
      createElement(PlacesSection, {
        invitation: {
          ...toInvitationData(sourceInvitationRow),
          places,
          showDecorativeLines,
        },
        theme,
        cardStyle: {},
      }),
    );
  }

  it("draws the header lines by default", () => {
    expect(renderPlaces()).toContain(`background:${DECORATIVE}`);
  });

  it("hides the header lines when the invitation turns them off", () => {
    const html = renderPlaces(false);

    expect(html).toContain("Hotéis");
    expect(html).not.toContain(`background:${DECORATIVE}`);
  });
});

describe("toInvitationData — decorative lines", () => {
  it("maps the stored decorative-lines visibility", () => {
    const invitation = toInvitationData({
      ...sourceInvitationRow,
      showDecorativeLines: false,
    });

    expect(invitation.showDecorativeLines).toBe(false);
  });
});
