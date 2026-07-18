import { describe, expect, it } from "vitest";
import {
  CUSTOM_INVITATION_PRICE_EUR_CENTS,
  getCustomInvitationPrice,
} from "@/lib/custom-invitation";

describe("custom invitation price", () => {
  it("keeps the fixed EUR 250 base price", () => {
    expect(CUSTOM_INVITATION_PRICE_EUR_CENTS).toBe(25_000);
    expect(getCustomInvitationPrice("EUR")).toBe("250 €");
  });

  it("converts and cleanly formats a non-EUR currency", () => {
    expect(getCustomInvitationPrice("MZN")).toBe("17 500 MZN");
  });

  it("does not present the fixed price as a starting price", () => {
    expect(getCustomInvitationPrice("EUR")).not.toContain("Desde");
    expect(getCustomInvitationPrice("MZN")).not.toContain("Desde");
  });
});
