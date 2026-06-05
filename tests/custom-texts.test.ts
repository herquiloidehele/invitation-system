import { describe, expect, it } from "vitest";

import { getCustomText } from "@/lib/custom-texts";
import type { CustomTexts } from "@/lib/types";

// Stand-in for `getTranslations("Invitation")` — returns the value the
// real next-intl resolver would return when given the same key. We use
// PT defaults here because that's what the resolver layers under.
function makeT(messages: Record<string, string>) {
  return (key: string, values?: Record<string, string>) => {
    const raw = messages[key] ?? key;
    if (!values) return raw;
    return Object.entries(values).reduce(
      (acc, [k, v]) => acc.replace(`{${k}}`, v),
      raw,
    );
  };
}

describe("getCustomText", () => {
  const messages = {
    cta_confirmButton: "Confirmar Presença",
    rsvp_namePlaceholder: "Nome do(s) Convidados(s)",
    calendar_weddingTitle: "Casamento {names}",
  };
  const t = makeT(messages);

  it("returns the override when customTexts has the key", () => {
    const ct: CustomTexts = { cta_confirmButton: "Vamos lá!" };
    expect(getCustomText(ct, "cta_confirmButton", t)).toBe("Vamos lá!");
  });

  it("falls back to the next-intl default when no override", () => {
    expect(getCustomText({}, "cta_confirmButton", t)).toBe(
      "Confirmar Presença",
    );
  });

  it("falls back to the next-intl default when customTexts is undefined", () => {
    expect(getCustomText(undefined, "cta_confirmButton", t)).toBe(
      "Confirmar Presença",
    );
  });

  it("falls back to the next-intl default when customTexts is null", () => {
    expect(getCustomText(null, "cta_confirmButton", t)).toBe(
      "Confirmar Presença",
    );
  });

  it("treats an empty-string override as missing (falls through)", () => {
    const ct: CustomTexts = { cta_confirmButton: "" };
    expect(getCustomText(ct, "cta_confirmButton", t)).toBe(
      "Confirmar Presença",
    );
  });

  it("returns the key string when neither override nor default exist", () => {
    const localT = makeT({});
    expect(getCustomText({}, "cta_confirmButton", localT)).toBe(
      "cta_confirmButton",
    );
  });

  it("interpolates ICU placeholders when values are provided", () => {
    expect(
      getCustomText({}, "calendar_weddingTitle", t, { names: "Jane & John" }),
    ).toBe("Casamento Jane & John");
  });
});
