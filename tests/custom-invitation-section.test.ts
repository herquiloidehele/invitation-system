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
      "Gostaria de criar o seu modelo Dream 100% personalizado?",
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
      "Would you like to create your 100% personalized Dream model?",
    );
    expect(englishHtml).toContain(
      "Don't worry, we can create a fully customized model with whatever structure you want.",
    );
    expect(spanishHtml).toContain(
      "¿Te gustaría crear tu modelo Dream 100% personalizado?",
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
