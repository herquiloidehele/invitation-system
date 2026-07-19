import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import en from "../messages/en.json";
import es from "../messages/es.json";
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
  });

  it.each([
    "components/shared/GiftsSection.tsx",
    "components/elegant-floral/GiftsSection.tsx",
  ])("%s resolves both titles from the Invitation namespace", (path) => {
    const source = readFileSync(path, "utf8");

    expect(source).toContain('useTranslations("Invitation")');
    expect(source).toContain('tInvitation("giftRegistry_listTitle")');
    expect(source).toContain(
      'tInvitation("giftRegistry_bankTransferTitle")',
    );
    expect(source).not.toContain('header="Lista de Presentes"');
    expect(source).not.toContain('header="Transferência Bancária"');
    expect(source).not.toContain('label = "Lista de Presentes"');
    expect(source).not.toContain('bankLabel = "Transferência Bancária"');
  });
});
