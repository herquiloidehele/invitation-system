import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migrationPath =
  "prisma/migrations/20260712120000_add_gift_reservations/migration.sql";
const migration = existsSync(migrationPath)
  ? readFileSync(migrationPath, "utf8")
  : "";

describe("GiftReservation database contract", () => {
  it("models invitation, gift, personalized guest, and public ownership", () => {
    expect(schema).toContain("model GiftReservation");
    expect(schema).toContain("@@unique([invitationSlug, giftItemId])");
    expect(schema).toMatch(/guestId\s+String\?\s+@unique/);
    expect(schema).toMatch(/managementToken\s+String\?\s+@unique/);
  });

  it("creates database uniqueness and cascade constraints", () => {
    expect(existsSync(migrationPath)).toBe(true);
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "GiftReservation_invitationSlug_giftItemId_key"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "GiftReservation_guestId_key"',
    );
    expect(migration).toContain("ON DELETE CASCADE");
    expect(migration).toContain("ON DELETE SET NULL");
  });
});
