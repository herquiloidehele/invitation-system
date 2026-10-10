import { describe, expect, it } from "vitest";

import { getClientMessages } from "@/i18n/client-messages";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import it_ from "../messages/it.json";
import pt from "../messages/pt.json";

// The admin preview and the in-place language swap read from this map rather
// than from the request config, so a locale missing here renders `undefined`.
describe("client message bundles", () => {
  it("serves the Italian bundle for Italian", () => {
    expect(getClientMessages("it")).toBe(it_);
    expect(getClientMessages("pt")).toBe(pt);
  });

  it("has a bundle for every supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(getClientMessages(locale)?.Invitation).toBeTruthy();
    }
  });
});
