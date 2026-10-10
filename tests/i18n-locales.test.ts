import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  buildLocaleHref,
  getDateFormatLocale,
  isSupportedLocale,
  resolveLocale,
  SUPPORTED_LOCALES,
} from "@/i18n/locales";
import { buildLanguageAlternates } from "@/lib/seo";

describe("i18n locale helpers", () => {
  it("declares Portuguese as the default locale", () => {
    expect(DEFAULT_LOCALE).toBe("pt");
    expect(SUPPORTED_LOCALES).toEqual(["pt", "en", "es", "it"]);
  });

  it("validates supported locale strings", () => {
    expect(isSupportedLocale("pt")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("es")).toBe(true);
    expect(isSupportedLocale("it")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
  });

  it("falls back to Portuguese for unknown locales", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("it")).toBe("it");
    expect(resolveLocale("fr")).toBe("pt");
    expect(resolveLocale(undefined)).toBe("pt");
  });

  it("maps app locales to browser date format locales", () => {
    expect(getDateFormatLocale("pt")).toBe("pt-PT");
    expect(getDateFormatLocale("en")).toBe("en-US");
    expect(getDateFormatLocale("es")).toBe("es-ES");
    expect(getDateFormatLocale("it")).toBe("it-IT");
  });

  it("builds locale hrefs without duplicating locale prefixes", () => {
    expect(buildLocaleHref("/", "pt")).toBe("/");
    expect(buildLocaleHref("/", "en")).toBe("/en");
    expect(buildLocaleHref("/es", "en")).toBe("/en");
    expect(buildLocaleHref("/es", "pt")).toBe("/");
    expect(buildLocaleHref("/es/demo", "en")).toBe("/en/demo");
    expect(buildLocaleHref("/en/s/demo", "es")).toBe("/es/s/demo");
    expect(buildLocaleHref("/en/s/demo?x=1", "pt")).toBe("/s/demo?x=1");
    expect(buildLocaleHref("/", "it")).toBe("/it");
    expect(buildLocaleHref("/it/demo", "pt")).toBe("/demo");
    expect(buildLocaleHref("/it/demo", "en")).toBe("/en/demo");
    expect(buildLocaleHref("/confirmar/demo#rsvp", "es")).toBe(
      "/es/confirmar/demo#rsvp",
    );
  });

  it("builds invitation-specific language alternates", () => {
    expect(
      buildLanguageAlternates("https://example.com", "/ana-joao", ["pt", "en"]),
    ).toEqual({
      pt: "https://example.com/ana-joao",
      en: "https://example.com/en/ana-joao",
      "x-default": "https://example.com/ana-joao",
    });
  });

  it("advertises every supported locale when no subset is given", () => {
    expect(buildLanguageAlternates("https://example.com", "/")).toEqual({
      pt: "https://example.com",
      en: "https://example.com/en",
      es: "https://example.com/es",
      it: "https://example.com/it",
      "x-default": "https://example.com",
    });
  });
});
