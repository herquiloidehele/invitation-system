import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InvitationLanguageSettings } from "@/components/admin/InvitationLanguageSettings";
import type { AppLocale } from "@/i18n/locales";

function render(enabledLocales: AppLocale[], activeLocale: AppLocale = "pt") {
  return renderToStaticMarkup(
    createElement(InvitationLanguageSettings, {
      enabled: true,
      enabledLocales,
      activeLocale,
      onEnabledChange: () => {},
      onEnabledLocalesChange: () => {},
      onActiveLocaleChange: () => {},
    }),
  );
}

describe("InvitationLanguageSettings", () => {
  it("offers a toggle for every language, Italian included", () => {
    const html = render(["pt"]);

    for (const label of ["Português", "English", "Español", "Italiano"]) {
      expect(html).toContain(`aria-label="Activar ${label}"`);
    }
  });

  it("lists Italian as an editing language once it is enabled", () => {
    expect(render(["pt", "it"], "it")).toMatch(
      /<button[^>]*aria-pressed="true"[^>]*>it<\/button>/,
    );
    expect(render(["pt", "en"])).not.toMatch(/<button[^>]*>it<\/button>/);
  });
});
