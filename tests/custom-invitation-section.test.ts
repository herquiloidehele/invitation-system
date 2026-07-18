import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { CustomInvitationSection } from "@/components/landing/CustomInvitationSection";
import en from "../messages/en.json";
import es from "../messages/es.json";
import pt from "../messages/pt.json";

type TestIntlProviderProps = Omit<
  ComponentProps<typeof NextIntlClientProvider>,
  "children"
> & {
  children?: ReactNode;
};

const TestIntlProvider =
  NextIntlClientProvider as ComponentType<TestIntlProviderProps>;

function renderSection(locale = "pt", messages: typeof pt = pt) {
  const section = createElement(CustomInvitationSection, {
    currentCurrency: "EUR",
  });

  return renderToStaticMarkup(
    createElement(
      TestIntlProvider,
      {
        locale,
        messages,
        timeZone: "Europe/Lisbon",
      },
      section,
    ),
  ).replaceAll("&#x27;", "'");
}

describe("CustomInvitationSection", () => {
  it("renders the approved copy and fixed price", () => {
    const html = renderSection();

    expect(html).toContain(
      "Não gostou dos templates do modelo Dream acima? Quer criar algo novo completamente seu?",
    );
    expect(html).toContain(
      "Não te preocupes, é possível criar o seu modelo totalmente customizado com a estrutura que tu desejares.",
    );
    expect(html).toContain("250");
    expect(html).toContain("preço do projeto");
    expect(html).toContain("1 mês");
    expect(html).not.toContain("Desde");
  });

  it("renders natural English and Spanish equivalents", () => {
    const englishHtml = renderSection("en", en);
    const spanishHtml = renderSection("es", es);

    expect(englishHtml).toContain(
      "Didn't like the Dream model templates above? Want to create something completely your own?",
    );
    expect(englishHtml).toContain(
      "Don't worry, we can create a fully customized model with whatever structure you want.",
    );
    expect(spanishHtml).toContain(
      "¿No te han gustado las plantillas del modelo Dream de arriba? ¿Quieres crear algo nuevo y completamente tuyo?",
    );
    expect(spanishHtml).toContain(
      "No te preocupes, podemos crear tu modelo totalmente personalizado con la estructura que quieras.",
    );
  });

  it("renders an accessible localized WhatsApp CTA", () => {
    const html = renderSection();

    expect(html).toContain('target="_blank"');
    expect(html).toContain(
      'aria-label="Criar um convite personalizado pelo WhatsApp"',
    );
    expect(html).toContain(
      "https://wa.me/351910671757?text=Ol%C3%A1!%20Gostaria%20de%20criar%20um%20convite%20100%25%20personalizado.",
    );
  });
});
