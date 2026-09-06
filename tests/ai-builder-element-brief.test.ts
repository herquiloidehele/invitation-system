import { describe, expect, it } from "vitest";

import { SELECTION_IMAGE_NAME, buildElementBrief } from "@/worker/lib/element-brief";
import type { SelectedElementDescriptor } from "@/lib/ai-preview-select";

const descriptor: SelectedElementDescriptor = {
  tag: "h1",
  text: "Ana & João",
  nearestHeading: "Ana & João",
  position: "top",
};

describe("buildElementBrief", () => {
  it("names the image file constant", () => {
    expect(SELECTION_IMAGE_NAME).toBe("selection.png");
  });

  it("describes the block and points at the crop when there is an image", () => {
    const brief = buildElementBrief(descriptor, true);
    expect(brief).toContain("<h1>");
    expect(brief).toContain("Ana & João");
    expect(brief).toContain("refs/selection.png");
    expect(brief.toLowerCase()).toContain("scope");
  });

  it("omits the crop reference when there is no image", () => {
    const brief = buildElementBrief(descriptor, false);
    expect(brief).not.toContain("refs/selection.png");
    expect(brief).toContain("<h1>");
  });

  it("uses the position when there is no nearest heading", () => {
    const brief = buildElementBrief(
      { tag: "img", text: "", nearestHeading: null, position: "middle" },
      false,
    );
    expect(brief).toContain("<img>");
    expect(brief).toContain("middle");
  });
});
