import { describe, it, expect } from "vitest";
import { buildPassUrl } from "@/lib/checkin-links";

describe("buildPassUrl", () => {
  it("builds a non-personalized pass URL with the check-in token as ?c=", () => {
    expect(buildPassUrl("https://x.com", "ana-leo", "pass_tok")).toBe(
      "https://x.com/ana-leo/pass?c=pass_tok",
    );
  });
});
