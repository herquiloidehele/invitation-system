import { describe, expect, it } from "vitest";

import { formatElapsed } from "@/lib/ai-build-elapsed";

describe("formatElapsed", () => {
  it("shows seconds under a minute", () => {
    expect(formatElapsed(0)).toBe("0s");
    expect(formatElapsed(5_400)).toBe("5s");
    expect(formatElapsed(59_000)).toBe("59s");
  });
  it("shows minutes + zero-padded seconds", () => {
    expect(formatElapsed(60_000)).toBe("1m 00s");
    expect(formatElapsed(65_000)).toBe("1m 05s");
    expect(formatElapsed(605_000)).toBe("10m 05s");
  });
  it("never goes negative", () => {
    expect(formatElapsed(-1000)).toBe("0s");
  });
});
