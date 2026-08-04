import { describe, expect, it } from "vitest";

import {
  buildPermanentFontKey,
  isPendingFontKey,
} from "@/lib/custom-fonts/storage";

describe("custom font storage keys", () => {
  it("accepts only direct pending-font keys", () => {
    expect(isPendingFontKey("uploads/fonts/pending/uuid-face.woff2")).toBe(true);
    expect(isPendingFontKey("uploads/images/face.woff2")).toBe(false);
    expect(isPendingFontKey("uploads/fonts/pending/../secret")).toBe(false);
    expect(isPendingFontKey("uploads/fonts/pending/nested/face.woff2")).toBe(
      false,
    );
  });

  it("builds a random permanent key below its family", () => {
    expect(buildPermanentFontKey("f1", "woff2", "fixed-id")).toBe(
      "uploads/fonts/f1/fixed-id.woff2",
    );
  });
});
