import { describe, expect, it, vi } from "vitest";

import {
  forwardImageEditorWheel,
  observeImageLayerEditor,
} from "@/lib/image-layer-editor-observer";

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

describe("forwardImageEditorWheel", () => {
  it("scrolls the preview when the wheel is over an image hitbox", () => {
    const scrollBy = vi.fn();

    forwardImageEditorWheel({ scrollBy }, 12, 180);

    expect(scrollBy).toHaveBeenCalledWith({ left: 12, top: 180 });
  });
});
