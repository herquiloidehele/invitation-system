import { describe, expect, it } from "vitest";

import { resolvePreviewRenderState } from "@/lib/ai-preview";

describe("resolvePreviewRenderState", () => {
  it("returns null when the revision belongs to another invitation", () => {
    const r = resolvePreviewRenderState({
      revision: { id: "r1", invitationId: "other", bundleKey: null },
      invitationId: "inv1",
    });
    expect(r).toBeNull();
  });

  it("points a draft at the auth-gated proxy and forces ai mode", () => {
    const r = resolvePreviewRenderState({
      revision: { id: "r1", invitationId: "inv1", bundleKey: null },
      invitationId: "inv1",
    });
    expect(r).toEqual({
      renderMode: "ai",
      aiBundleUrl: "/api/admin/ai/builds/r1/bundle.js",
    });
  });

  it("points a published revision at its S3 bundle key", () => {
    const r = resolvePreviewRenderState({
      revision: {
        id: "r1",
        invitationId: "inv1",
        bundleKey: "ai-bundles/inv1/r1.js",
      },
      invitationId: "inv1",
      publicUrlForKey: (k) => `https://cdn.test/${k}`,
    });
    expect(r).toEqual({
      renderMode: "ai",
      aiBundleUrl: "https://cdn.test/ai-bundles/inv1/r1.js",
    });
  });
});
