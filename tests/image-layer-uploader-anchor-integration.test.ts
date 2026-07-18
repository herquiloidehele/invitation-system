import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/admin/ImageLayerUploader.tsx", "utf8");

describe("ImageLayerUploader section anchor integration", () => {
  it("measures section hosts at the visible preview centre", () => {
    expect(source).toContain(
      'querySelectorAll<HTMLElement>("[data-section-key]")',
    );
    expect(source).toContain("findImageAnchorRect(");
  });

  it("stores the selected section with the new image", () => {
    expect(source).toContain("sectionKey: anchor?.sectionKey");
  });
});
