import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import SaveTheDateSection from "@/components/shared/SaveTheDateSection";
import { MOCK_INVITATION } from "@/lib/mock-invitation";
import { resolveTextStyles } from "@/lib/text-styles";
import type { SaveDateStyle, TemplateTheme } from "@/lib/types";
import it_ from "../messages/it.json";
import pt from "../messages/pt.json";

const theme = {
  id: "t1",
  name: "test",
  label: "Test",
  description: "",
  envelope: { base: "#fff", topFlap: "#fff", bottomFlap: "#fff" },
  bg: "#fff",
  cardBg: "#fff",
  cardBorder: "#eee",
  primary: "#111",
  secondary: "#222",
  accent: "#C9A961",
  textPrimary: "#111",
  textSecondary: "#555",
  textMuted: "#999",
  displayFont: "Display",
  bodyFont: "Body",
  uiFont: "UI",
  ctaPrimaryBg: "#111",
  ctaPrimaryText: "#fff",
  ctaSecondaryBorder: "#111",
  ctaSecondaryText: "#111",
  ctaRadius: "8px",
  monogramColor: "#111",
  tapTextColor: "#111",
  decorativeColor: "#ccc",
} as TemplateTheme;

type IntlProps = {
  locale: string;
  messages: typeof pt;
  timeZone: string;
  children?: ReactNode;
};
const Intl = NextIntlClientProvider as ComponentType<IntlProps>;

// Far in the future so the section renders its countdown tiles rather than the
// "today is the day" state the mock's own (past) date would produce.
const invitation = {
  ...MOCK_INVITATION,
  date: { ...MOCK_INVITATION.date, iso: "2099-09-20T17:00:00", year: "2099" },
};

/** Visible text of the section, with the markup stripped. */
function renderText(
  saveDateStyle: SaveDateStyle,
  locale: "pt" | "it" = "pt",
  customLabel?: string,
): string {
  const html = renderToStaticMarkup(
    createElement(
      Intl,
      {
        locale,
        messages: locale === "it" ? it_ : pt,
        timeZone: "Europe/Lisbon",
      },
      createElement(SaveTheDateSection, {
        invitation: { ...invitation, saveDateStyle },
        theme,
        ts: resolveTextStyles(theme, null),
        customTexts: customLabel ? { saveDate_label: customLabel } : undefined,
      }),
    ),
  );
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("Save the Date section — countdown style", () => {
  it("shows no 'Save the Date' label", () => {
    expect(renderText("countdown")).not.toMatch(/save\s+the\s+date/i);
    expect(renderText("countdown", "it")).not.toMatch(/save\s+the\s+date/i);
  });

  it("shows no label even when the invitation overrides its text", () => {
    expect(renderText("countdown", "pt", "Reserve a data")).not.toContain(
      "Reserve",
    );
  });

  it("still shows the date, the countdown and the calendar link", () => {
    const text = renderText("countdown");
    expect(text).toContain("2099");
    expect(text).toContain(pt.Invitation.saveDate_days);
    expect(text).toContain(pt.Invitation.cta_addToCalendar);
  });
});

describe("Save the Date section — other styles keep the label", () => {
  it.each<SaveDateStyle>([
    "classic",
    "inline-countdown",
    "quad-cards",
    "cinematic",
    "minimal-line",
  ])("%s", (style) => {
    expect(renderText(style)).toMatch(/save\s+the\s+date/i);
  });
});
