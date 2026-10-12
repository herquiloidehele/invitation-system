import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CUSTOM_TEXT_GROUPS, getCustomText } from "@/lib/custom-texts";
import { sanitizeInvitationTranslations } from "@/lib/invitation-translations";
import type { CustomTexts } from "@/lib/types";
import en from "../messages/en.json";
import es from "../messages/es.json";
import it_ from "../messages/it.json";
import pt from "../messages/pt.json";

describe("gift accordion title localization", () => {
  it("defines the gift-list and bank-transfer titles in every locale", () => {
    expect(pt.Invitation.giftRegistry_listTitle).toBe("Lista de Presentes");
    expect(pt.Invitation.giftRegistry_bankTransferTitle).toBe(
      "Transferência Bancária",
    );
    expect(en.Invitation.giftRegistry_listTitle).toBe("Gift List");
    expect(en.Invitation.giftRegistry_bankTransferTitle).toBe("Bank Transfer");
    expect(es.Invitation.giftRegistry_listTitle).toBe("Lista de Regalos");
    expect(es.Invitation.giftRegistry_bankTransferTitle).toBe(
      "Transferencia Bancaria",
    );
    expect(it_.Invitation.giftRegistry_listTitle).toBe("Lista Regali");
    expect(it_.Invitation.giftRegistry_bankTransferTitle).toBe(
      "Bonifico Bancario",
    );
  });

  it.each([
    "components/shared/GiftsSection.tsx",
    "components/elegant-floral/GiftsSection.tsx",
  ])("%s resolves both titles through the custom-text resolver", (path) => {
    const source = readFileSync(path, "utf8");

    expect(source).toContain('header={t("giftRegistry_listTitle")}');
    expect(source).toContain('header={t("giftRegistry_bankTransferTitle")}');
    // Reading the namespace directly would skip the per-invitation override.
    expect(source).not.toContain('tInvitation("giftRegistry_');
    expect(source).not.toContain('header="Lista de Presentes"');
    expect(source).not.toContain('header="Transferência Bancária"');
    expect(source).not.toContain('label = "Lista de Presentes"');
    expect(source).not.toContain('bankLabel = "Transferência Bancária"');
  });

  it("hands the elegant-floral section the invitation's overrides", () => {
    const section = readFileSync(
      "components/elegant-floral/GiftsSection.tsx",
      "utf8",
    );
    const page = readFileSync(
      "components/elegant-floral/ElegantFloralPage.tsx",
      "utf8",
    );

    expect(section).toContain("const t = useCustomText(customTexts)");
    expect(page).toMatch(
      /<GiftsSection[\s\S]*?customTexts=\{invitation\.customTexts\}[\s\S]*?\/>/,
    );
  });
});

describe("gift accordion title overrides", () => {
  const t = (key: string) =>
    (pt.Invitation as Record<string, string>)[key] ?? key;

  it("lets an invitation replace either title", () => {
    const ct: CustomTexts = {
      giftRegistry_listTitle: "Lista de Casamento",
      giftRegistry_bankTransferTitle: "IBAN dos Noivos",
    };

    expect(getCustomText(ct, "giftRegistry_listTitle", t)).toBe(
      "Lista de Casamento",
    );
    expect(getCustomText(ct, "giftRegistry_bankTransferTitle", t)).toBe(
      "IBAN dos Noivos",
    );
  });

  it("keeps the locale default while the field is empty", () => {
    const ct: CustomTexts = { giftRegistry_listTitle: "" };

    expect(getCustomText(ct, "giftRegistry_listTitle", t)).toBe(
      "Lista de Presentes",
    );
    expect(getCustomText(null, "giftRegistry_bankTransferTitle", t)).toBe(
      "Transferência Bancária",
    );
  });

  it("offers both titles right after the gifts section title", () => {
    const fields = CUSTOM_TEXT_GROUPS.find(
      (group) => group.id === "sectionTitles",
    )!.fields;
    const at = fields.findIndex(
      (field) => field.key === "sectionTitle_giftRegistry",
    );

    expect(fields.slice(at + 1, at + 3)).toEqual([
      {
        key: "giftRegistry_listTitle",
        label: "Presentes — Lista de Presentes",
        placeholder: "Lista de Presentes",
      },
      {
        key: "giftRegistry_bankTransferTitle",
        label: "Presentes — Transferência Bancária",
        placeholder: "Transferência Bancária",
      },
    ]);
  });

  it("keeps a translated override through sanitization", () => {
    const sanitized = sanitizeInvitationTranslations({
      en: {
        customTexts: {
          giftRegistry_listTitle: "Wedding List",
          giftRegistry_bankTransferTitle: "Our IBAN",
        },
      },
    });

    expect(sanitized?.en?.customTexts).toEqual({
      giftRegistry_listTitle: "Wedding List",
      giftRegistry_bankTransferTitle: "Our IBAN",
    });
  });
});
