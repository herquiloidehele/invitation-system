import { describe, expect, it } from "vitest";

import { buildSourceManifest } from "@/worker/lib/source-manifest";

describe("buildSourceManifest", () => {
  it("is empty for a first build", () => {
    expect(buildSourceManifest({})).toBe("");
  });

  it("lists every file with its size and tells the agent not to rediscover them", () => {
    const m = buildSourceManifest({
      "index.tsx": "x".repeat(2048),
      "sections/Hero.tsx": "y".repeat(5120),
    });
    expect(m).toContain("index.tsx (2.0 KB)");
    expect(m).toContain("sections/Hero.tsx (5.0 KB)");
    expect(m.toLowerCase()).toContain("do not grep");
  });
});
