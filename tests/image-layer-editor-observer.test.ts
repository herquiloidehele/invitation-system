import { describe, expect, it, vi } from "vitest";

import { observeImageLayerEditor } from "@/lib/image-layer-editor-observer";

describe("observeImageLayerEditor", () => {
  it("measures immediately after the preview ref has been attached", () => {
    const preview = new EventTarget();
    const viewport = new EventTarget();
    const onMeasure = vi.fn();

    const cleanup = observeImageLayerEditor(preview, viewport, onMeasure);

    expect(onMeasure).toHaveBeenCalledTimes(1);

    cleanup();
  });
});
