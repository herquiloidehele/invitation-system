import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CUSTOM_TEXT_GROUPS, getCustomText } from "@/lib/custom-texts";
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

  it("interpolates placeholders into an override", () => {
    const ct: CustomTexts = { calendar_weddingTitle: "Boda de {names}" };
    expect(
      getCustomText(ct, "calendar_weddingTitle", t, { names: "Jane & John" }),
    ).toBe("Boda de Jane & John");
  });

  it("leaves unknown placeholders in an override untouched", () => {
    const ct: CustomTexts = { calendar_weddingTitle: "{names} — {venue}" };
    expect(
      getCustomText(ct, "calendar_weddingTitle", t, { names: "Jane" }),
    ).toBe("Jane — {venue}");
  });

  it("returns an override unchanged when no values are supplied", () => {
    const ct: CustomTexts = { calendar_weddingTitle: "Boda de {names}" };
    expect(getCustomText(ct, "calendar_weddingTitle", t)).toBe(
      "Boda de {names}",
    );
  });
});

function customTextTypeKeys(): string[] {
  const source = readFileSync("lib/types.ts", "utf8");
  const block = source.match(/export interface CustomTexts \{([\s\S]*?)\n\}/);
  if (!block) throw new Error("CustomTexts interface not found in lib/types.ts");
  return [...block[1].matchAll(/^\s*(\w+)\??:\s*string/gm)].map((m) => m[1]);
}

function invitationMessages(locale: string): Record<string, string> {
  return JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")).Invitation;
}

describe("customTexts admin coverage", () => {
  const groupKeys = CUSTOM_TEXT_GROUPS.flatMap((group) =>
    group.fields.map((field) => field.key as string),
  );

  // sanitizeCustomTexts whitelists against CUSTOM_TEXT_GROUPS, so any typed key
  // missing from the groups is both un-editable and silently dropped on write.
  it("exposes every CustomTexts key in CUSTOM_TEXT_GROUPS", () => {
    const missing = customTextTypeKeys().filter(
      (key) => !groupKeys.includes(key),
    );
    expect(missing).toEqual([]);
  });

  it("has no duplicate keys across groups", () => {
    expect(groupKeys.length).toBe(new Set(groupKeys).size);
  });

  it("has no duplicate group ids", () => {
    const ids = CUSTOM_TEXT_GROUPS.map((group) => group.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("backs every CustomTexts key with a Portuguese default message", () => {
    const pt = invitationMessages("pt");
    const missing = customTextTypeKeys().filter((key) => !(key in pt));
    expect(missing).toEqual([]);
  });
});

describe("Invitation message parity", () => {
  it("defines the same key set in pt, en and es", () => {
    const pt = Object.keys(invitationMessages("pt")).sort();
    expect(Object.keys(invitationMessages("en")).sort()).toEqual(pt);
    expect(Object.keys(invitationMessages("es")).sort()).toEqual(pt);
  });
});
