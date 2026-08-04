import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ImageLayerEditModeControl from "@/components/admin/ImageLayerEditModeControl";
import {
  imageLayerEditorModeReducer,
  isImageLayerEditorActive,
} from "@/lib/image-layer-editor-mode";

describe("imageLayerEditorModeReducer", () => {
  it("enables editing after an image is added", () => {
    expect(imageLayerEditorModeReducer(false, { type: "image-added" })).toBe(
      true,
    );
  });

  it("applies an explicit mode change", () => {
    expect(
      imageLayerEditorModeReducer(false, {
        type: "set-editing",
        editing: true,
      }),
    ).toBe(true);
    expect(
      imageLayerEditorModeReducer(true, {
        type: "set-editing",
        editing: false,
      }),
    ).toBe(false);
  });

  it("disables editing when the last image is removed", () => {
    expect(
      imageLayerEditorModeReducer(true, {
        type: "items-changed",
        itemCount: 0,
      }),
    ).toBe(false);
  });

  it("preserves editing when images remain", () => {
    expect(
      imageLayerEditorModeReducer(true, {
        type: "items-changed",
        itemCount: 1,
      }),
    ).toBe(true);
  });
});

describe("isImageLayerEditorActive", () => {
  it("activates only when images exist and editing was requested", () => {
    expect(isImageLayerEditorActive(1, true)).toBe(true);
  });

  it("stays inactive when editing was not requested", () => {
    expect(isImageLayerEditorActive(1, false)).toBe(false);
  });

  it("stays inactive without images", () => {
    expect(isImageLayerEditorActive(0, true)).toBe(false);
  });
});

describe("ImageLayerEditModeControl", () => {
  it("renders a disabled activation control without images", () => {
    const html = renderToStaticMarkup(
      createElement(ImageLayerEditModeControl, {
        active: false,
        hasImages: false,
        onActiveChange: () => undefined,
      }),
    );

    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("Editar imagens na pré-visualização");
  });

  it("renders the active completion control", () => {
    const html = renderToStaticMarkup(
      createElement(ImageLayerEditModeControl, {
        active: true,
        hasImages: true,
        onActiveChange: () => undefined,
      }),
    );

    expect(html).not.toContain('disabled=""');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Concluir edição de imagens");
  });
});
