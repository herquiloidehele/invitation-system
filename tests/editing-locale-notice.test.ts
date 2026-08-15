import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EditingLocaleNotice } from "@/components/admin/EditingLocaleNotice";

function render(activeLocale: "pt" | "en" | "es"): string {
  return renderToStaticMarkup(
    createElement(EditingLocaleNotice, { activeLocale, onReset: () => {} }),
  );
}

describe("EditingLocaleNotice", () => {
  it("stays out of the way while editing Portuguese", () => {
    expect(render("pt")).toBe("");
  });

  it("names the locale being edited", () => {
    expect(render("en")).toContain("A editar em English");
    expect(render("es")).toContain("A editar em Español");
  });

  it("offers a way back to Portuguese", () => {
    expect(render("en")).toContain("Voltar a Português");
  });

  it("is announced to assistive tech", () => {
    expect(render("en")).toContain('role="status"');
  });
});

// The editing locale is otherwise only visible inside the collapsed "Idiomas"
// accordion, so switching locale from the preview changed the whole form with
// nothing on screen to say so.
describe("both admin forms surface the editing locale", () => {
  for (const file of [
    "app/admin/invitations/InvitationForm.tsx",
    "app/admin/invitations/ExternalInvitationForm.tsx",
  ]) {
    it(`${file} renders the notice`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("<EditingLocaleNotice");
      expect(source).toContain("activeLocale={activeLocale}");
    });
  }
});
