import { describe, expect, it } from "vitest";

import { decodePngDataUrl } from "@/lib/ai-selection-image";

// 1×1 transparent PNG.
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("decodePngDataUrl", () => {
  it("decodes a base64 PNG data URL to a non-empty Buffer", () => {
    const buf = decodePngDataUrl(PNG);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(0);
    // PNG magic number.
    expect(buf!.subarray(0, 4).toString("hex")).toBe("89504e47");
  });
  it("rejects a non-PNG data URL", () => {
    expect(decodePngDataUrl("data:image/jpeg;base64,/9j/4AAQ")).toBeNull();
  });
  it("rejects a plain string", () => {
    expect(decodePngDataUrl("not a data url")).toBeNull();
  });
  it("rejects an empty payload", () => {
    expect(decodePngDataUrl("data:image/png;base64,")).toBeNull();
  });
});
