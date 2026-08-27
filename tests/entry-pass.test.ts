import { describe, it, expect } from "vitest";
import { buildEntryPassValue } from "@/lib/entry-pass";

describe("buildEntryPassValue", () => {
  it("returns the personal invite URL when a guestToken is set", () => {
    expect(
      buildEntryPassValue({
        origin: "https://x.com",
        slug: "ana-leo",
        guestToken: "gtok",
      }),
    ).toBe("https://x.com/ana-leo?g=gtok");
  });

  it("guestToken wins over checkInToken", () => {
    expect(
      buildEntryPassValue({
        origin: "https://x.com",
        slug: "ana-leo",
        guestToken: "gtok",
        checkInToken: "ptok",
      }),
    ).toBe("https://x.com/ana-leo?g=gtok");
  });

  it("returns the pass URL when only checkInToken is set", () => {
    expect(
      buildEntryPassValue({
        origin: "https://x.com",
        slug: "ana-leo",
        checkInToken: "ptok",
      }),
    ).toBe("https://x.com/ana-leo/pass?c=ptok");
  });

  it("returns null when neither token is set", () => {
    expect(
      buildEntryPassValue({ origin: "https://x.com", slug: "ana-leo" }),
    ).toBeNull();
    expect(
      buildEntryPassValue({
        origin: "https://x.com",
        slug: "ana-leo",
        checkInToken: null,
      }),
    ).toBeNull();
  });
});
