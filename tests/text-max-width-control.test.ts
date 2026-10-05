import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TextStyle } from "@/lib/types";

const overrides = vi.hoisted(() => ({ current: {} as TextStyle }));

// The toolbar only renders with a selected element, and selection lives in
// provider state that a static render cannot reach — stub the hook instead.
vi.mock("@/components/shared/EditableText", () => ({
  useInlineTextEdit: () => ({
    selectedElement: "efVerse",
    selectedRef: null,
    selectElement: () => undefined,
    clearSelection: () => undefined,
    updateStyle: () => undefined,
    updateSpacing: () => undefined,
    getOverrides: () => overrides.current,
    getSpacingOverrides: () => undefined,
  }),
}));

import TextStyleToolbar from "@/components/admin/TextStyleToolbar";

function maxWidthInput(style: TextStyle): string {
  overrides.current = style;
  const html = renderToStaticMarkup(createElement(TextStyleToolbar));
  const match = html.match(
    /<label[^>]*title="Largura máxima \(% do espaço disponível\)"[^>]*>.*?(<input[^>]*>)/,
  );
  expect(match).not.toBeNull();
  return match![1];
}

describe("TextStyleToolbar max-width control", () => {
  it("is empty (Auto) when the element has no max-width override", () => {
    const input = maxWidthInput({});
    expect(input).toContain('placeholder="Auto"');
    expect(input).toContain('value=""');
  });

  it("shows the stored percentage as a plain number", () => {
    expect(maxWidthInput({ maxWidth: "95%" })).toContain('value="95"');
  });

  it("caps the stepper at 100%", () => {
    expect(maxWidthInput({})).toContain('max="100"');
  });
});
