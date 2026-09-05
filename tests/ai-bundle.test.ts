import { describe, expect, it } from "vitest";

import { buildBundleObjectKey } from "@/lib/ai-bundle";

describe("buildBundleObjectKey", () => {
  it("namespaces by invitation and revision", () => {
    expect(buildBundleObjectKey("inv_1", "rev_9")).toBe(
      "ai-bundles/inv_1/rev_9.js",
    );
  });

  it("keeps distinct revisions of one invitation at distinct keys", () => {
    expect(buildBundleObjectKey("inv_1", "rev_9")).not.toBe(
      buildBundleObjectKey("inv_1", "rev_10"),
    );
  });
});
