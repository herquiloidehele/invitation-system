import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import ElegantFloralGiftsSection from "@/components/elegant-floral/GiftsSection";
import SharedGiftsSection from "@/components/shared/GiftsSection";
import { getCustomText } from "@/lib/custom-texts";
import { resolveTextStyles } from "@/lib/text-styles";
import type { CustomTexts, GiftRegistry, TemplateTheme } from "@/lib/types";
import { sourceTheme } from "./fixtures/invitation-duplication";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

// The sections only navigate on click; static markup never reaches the router.
vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: () => {}, back: () => {} }),
}));

const theme = sourceTheme as unknown as TemplateTheme;

// A link and a bank row, so both accordions render.
const giftRegistry: GiftRegistry = {
  enabled: true,
  text: "A vossa presença é o melhor presente.",
  link: "https://example.com/lista",
  bankTransfer: [{ id: "bank-1", label: "IBAN", value: "PT50 0000 0000" }],
};

type TestIntlProviderProps = Omit<
  ComponentProps<typeof NextIntlClientProvider>,
  "children"
> & { children?: ReactNode };
const TestIntlProvider =
  NextIntlClientProvider as ComponentType<TestIntlProviderProps>;

function render(element: ReactElement, locale: "pt" | "en" = "pt"): string {
  return renderToStaticMarkup(
    createElement(
      TestIntlProvider,
      {
        locale,
        messages: locale === "pt" ? pt : en,
        timeZone: "Europe/Lisbon",
      },
      element,
    ),
  );
}

function renderElegantFloral(
  customTexts?: CustomTexts | null,
  locale: "pt" | "en" = "pt",
): string {
  return render(
    createElement(ElegantFloralGiftsSection, {
      giftRegistry,
      theme,
      slug: "ana-rui",
      customTexts,
    }),
    locale,
  );
}

function renderShared(customTexts?: CustomTexts | null): string {
  const tn = (key: string) =>
    (pt.Invitation as Record<string, string>)[key] ?? key;
  return render(
    createElement(SharedGiftsSection, {
      giftRegistry,
      theme,
      ts: resolveTextStyles(theme, null),
      cardStyle: { cardBg: "#fff", cardBorder: "#eee", borderRadius: 16 },
      slug: "ana-rui",
      t: (key, values) => getCustomText(customTexts, key, tn, values),
    }),
  );
}

describe.each([
  ["elegant-floral", renderElegantFloral],
  ["shared", renderShared],
])("%s gifts section accordion titles", (_name, renderSection) => {
  it("shows the locale defaults without overrides", () => {
    const html = renderSection();

    expect(html).toContain("Lista de Presentes");
    expect(html).toContain("Transferência Bancária");
  });

  it("shows the invitation's own titles instead", () => {
    const html = renderSection({
      giftRegistry_listTitle: "Lista de Casamento",
      giftRegistry_bankTransferTitle: "IBAN dos Noivos",
    });

    expect(html).toContain("Lista de Casamento");
    expect(html).toContain("IBAN dos Noivos");
    expect(html).not.toContain("Lista de Presentes");
    expect(html).not.toContain("Transferência Bancária");
  });

  it("overrides one title and keeps the other default", () => {
    const html = renderSection({
      giftRegistry_listTitle: "Lista de Casamento",
    });

    expect(html).toContain("Lista de Casamento");
    expect(html).toContain("Transferência Bancária");
  });
});

describe("elegant-floral gifts section in another language", () => {
  it("falls back to that language's defaults", () => {
    const html = renderElegantFloral(null, "en");

    expect(html).toContain("Gift List");
    expect(html).toContain("Bank Transfer");
  });
});
