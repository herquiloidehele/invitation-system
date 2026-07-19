import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildInvitationCreateData } from "@/lib/invitation-create-data";
import { toAdminInvitationInitialData } from "@/lib/invitation-admin-initial-data";
import { buildDuplicateInvitationInitialData } from "@/lib/invitation-duplication";
import type { LandingTranslations } from "@/lib/landing-translations";
import {
  duplicateForm,
  sourceInvitationRow,
} from "./fixtures/invitation-duplication";

const migrationPath =
  "prisma/migrations/20260719123000_add_landing_translations/migration.sql";

describe("landing translation persistence", () => {
  it("declares additive JSON fields on both product models", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const migration = existsSync(migrationPath)
      ? readFileSync(migrationPath, "utf8")
      : "";

    expect(schema).toMatch(
      /model Invitation \{[\s\S]*?landingTranslations\s+Json\?/,
    );
    expect(schema).toMatch(
      /model SaveTheDate \{[\s\S]*?landingTranslations\s+Json\?/,
    );
    expect(existsSync(migrationPath)).toBe(true);
    expect(migration).toContain(
      'ALTER TABLE "Invitation" ADD COLUMN "landingTranslations" JSONB;',
    );
    expect(migration).toContain(
      'ALTER TABLE "SaveTheDate" ADD COLUMN "landingTranslations" JSONB;',
    );
  });

  it("sanitizes landing translations when creating an invitation", () => {
    const data = buildInvitationCreateData(
      duplicateForm({
        landingTranslations: {
          en: {
            landingModelName: "Classic",
            landingSubtitle: " ",
            unknown: "discard",
          },
          fr: {
            landingDescription: "Description",
          },
        } as unknown as LandingTranslations,
      }),
      "theme-copy",
    );

    expect(data.landingTranslations).toEqual({
      en: {
        landingModelName: "Classic",
      },
    });
  });

  it("sanitizes landing translations when hydrating an invitation", () => {
    const initial = toAdminInvitationInitialData({
      ...sourceInvitationRow,
      landingTranslations: {
        es: {
          landingDescription: "Invitación digital",
          landingSubtitle: 42,
        },
      },
    });

    expect(initial.landingTranslations).toEqual({
      es: {
        landingDescription: "Invitación digital",
      },
    });
  });

  it("clears landing translations when duplicating an invitation", () => {
    const duplicate = buildDuplicateInvitationInitialData({
      ...sourceInvitationRow,
      landingTranslations: {
        en: {
          landingModelName: "Classic",
        },
      },
    });

    expect(duplicate.landingTranslations).toBeNull();
  });

  it("wires sanitized persistence through every remaining boundary", () => {
    const files = [
      "app/api/admin/invitations/[id]/route.ts",
      "app/api/admin/save-the-date/route.ts",
      "app/api/admin/save-the-date/[id]/route.ts",
      "app/admin/save-the-dates/[id]/edit/page.tsx",
      "lib/invitations.ts",
      "prisma/seed.ts",
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toContain("landingTranslations");
      expect(source, file).toContain("sanitizeLandingTranslations");
    }
  });
});
