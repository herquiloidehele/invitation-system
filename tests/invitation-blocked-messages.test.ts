import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const KEYS = ["title", "description", "reasonLabel", "footer"].sort();

describe("InvitationBlocked messages", () => {
  for (const locale of ["pt", "en", "es"]) {
    it(`messages/${locale}.json carries the namespace and the metadata title`, () => {
      const messages = JSON.parse(
        readFileSync(`messages/${locale}.json`, "utf8"),
      ) as {
        Metadata: Record<string, string>;
        InvitationBlocked?: Record<string, string>;
      };

      expect(Object.keys(messages.InvitationBlocked ?? {}).sort()).toEqual(KEYS);
      for (const key of KEYS) {
        expect(messages.InvitationBlocked?.[key]?.trim()).toBeTruthy();
      }
      expect(messages.Metadata.invitationBlocked?.trim()).toBeTruthy();
    });
  }
});
