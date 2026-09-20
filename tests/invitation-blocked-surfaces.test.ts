import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Every surface keyed by an invitation must honour an admin block. These
// source-text assertions (pattern: tests/invitation-language-pages.test.ts)
// keep the enforcement map from silently shrinking.

const PAGES = [
  "app/[locale]/[slug]/page.tsx",
  "app/[locale]/confirmar/[slug]/page.tsx",
  "app/[locale]/[slug]/gifts/page.tsx",
  "app/[locale]/[slug]/pass/page.tsx",
  "app/[locale]/confirmacoes/[token]/page.tsx",
];

describe("blocked invitation — pages", () => {
  for (const file of PAGES) {
    it(`${file} renders InvitationBlockedPage when blocked`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("<InvitationBlockedPage");
      expect(source).toMatch(/getInvitationBlock\(|getInvitationBlockState\(/);
    });
  }
});

const ROUTES = [
  "app/api/rsvp/route.ts",
  "app/api/guests/by-token/[token]/route.ts",
  "app/api/owner/[token]/guests/route.ts",
  "app/api/owner/[token]/guests/[guestId]/route.ts",
  "app/api/owner/[token]/checkin/route.ts",
  "app/api/owner/[token]/checkin/scan/route.ts",
  "app/api/owner/[token]/checkin/resolve/route.ts",
  "app/api/export/rsvps/[token]/route.ts",
];

describe("blocked invitation — API routes", () => {
  for (const file of ROUTES) {
    it(`${file} guards with isInvitationBlocked + invitationBlockedResponse`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("isInvitationBlocked(");
      expect(source).toContain("invitationBlockedResponse(");
    });
  }
});

const LIBS = ["lib/gift-reservations.ts", "lib/guests.ts"];

describe("blocked invitation — service libs", () => {
  for (const file of LIBS) {
    it(`${file} checks isInvitationBlocked`, () => {
      expect(readFileSync(file, "utf8")).toContain("isInvitationBlocked(");
    });
  }
});

describe("blocked invitation — sitemap", () => {
  it("excludes blocked demo invitations", () => {
    expect(readFileSync("app/sitemap.ts", "utf8")).toContain("blockedAt: null");
  });
});
