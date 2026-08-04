import { describe, expect, it } from "vitest";

import { isInlineEditorFloatingLayerTarget } from "@/lib/inline-editor-floating-layers";

function targetInside(marker: string) {
  return {
    closest(selector: string) {
      return selector.includes(marker) ? { marker } : null;
    },
  };
}

describe("inline editor floating layers", () => {
  it("keeps the selection open for font dropdown and upload-dialog portals", () => {
    expect(
      isInlineEditorFloatingLayerTarget(
        targetInside("data-font-picker-dropdown"),
      ),
    ).toBe(true);
    expect(
      isInlineEditorFloatingLayerTarget(
        targetInside("data-font-upload-dialog"),
      ),
    ).toBe(true);
  });

  it("treats unrelated page content as an outside interaction", () => {
    expect(isInlineEditorFloatingLayerTarget(targetInside("main"))).toBe(false);
    expect(isInlineEditorFloatingLayerTarget(null)).toBe(false);
  });
});
