import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildInvitationCreateData } from "@/lib/invitation-create-data";
import { toAdminInvitationInitialData } from "@/lib/invitation-admin-initial-data";
import {
  duplicateForm,
  sourceInvitationRow,
} from "./fixtures/invitation-duplication";

describe("invitation language persistence", () => {
  it("writes normalized language settings on create", () => {
    const body = duplicateForm({
      invitationType: "standard",
      languageSwitcherEnabled: true,
      enabledLocales: ["es", "pt", "en", "en"],
      translations: { en: { quote: "Forever" } },
    });

    const data = buildInvitationCreateData(body, "theme-copy");

    expect(data.languageSwitcherEnabled).toBe(true);
    expect(data.enabledLocales).toEqual(["pt", "en", "es"]);
    expect(data.translations).toEqual({ en: { quote: "Forever" } });
  });

  it("hydrates settings and translations for editing and duplication", () => {
    const initial = toAdminInvitationInitialData({
      ...sourceInvitationRow,
      languageSwitcherEnabled: true,
      enabledLocales: ["pt", "en"],
      translations: { en: { quote: "Forever" } },
    });

    expect(initial).toMatchObject({
      languageSwitcherEnabled: true,
      enabledLocales: ["pt", "en"],
      translations: { en: { quote: "Forever" } },
    });
  });

  it("declares additive database fields and update-route persistence", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const migration = readFileSync(
      "prisma/migrations/20260719190000_add_invitation_translations/migration.sql",
      "utf8",
    );
    const updateRoute = readFileSync(
      "app/api/admin/invitations/[id]/route.ts",
      "utf8",
    );
    const publicMapper = readFileSync("lib/invitations.ts", "utf8");
    const seed = readFileSync("prisma/seed.ts", "utf8");

    expect(schema).toContain("languageSwitcherEnabled Boolean");
    expect(schema).toMatch(
      /enabledLocales\s+String\[\]\s+@default\(\["pt"\]\)/,
    );
    expect(schema).toMatch(/translations\s+Json\?/);
    expect(migration).toContain('"enabledLocales" TEXT[]');
    expect(updateRoute).toContain("sanitizeInvitationTranslations");
    expect(updateRoute).toContain("validateInvitationLanguageSettings");
    expect(publicMapper).toContain("languageSwitcherEnabled:");
    expect(publicMapper).toContain("enabledLocales:");
    expect(publicMapper).toContain("translations:");
    expect(seed).toContain("languageSwitcherEnabled:");
    expect(seed).toContain("enabledLocales:");
    expect(seed).toContain("translations:");
  });
});
