import { describe, expect, it } from "vitest";

import { getUploadMaxSizeBytes } from "@/lib/upload-limits";

describe("getUploadMaxSizeBytes", () => {
  it("keeps the existing image limit", () => {
    expect(getUploadMaxSizeBytes("images")).toBe(5 * 1024 * 1024);
  });

  it("allows documents up to 10MB", () => {
    expect(getUploadMaxSizeBytes("documents")).toBe(10 * 1024 * 1024);
  });

  it("still honours the rsvp-background profile", () => {
    expect(getUploadMaxSizeBytes("images", "rsvp-background")).toBe(500 * 1024);
  });
});
