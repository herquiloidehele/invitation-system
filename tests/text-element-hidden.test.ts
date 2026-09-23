import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EditableText,
  InlineTextEditProvider,
} from "@/components/shared/EditableText";
import { SpacingStyleProvider } from "@/components/shared/SpacingStyleProvider";
import {
  applyOverride,
  isTextElementHidden,
  resolveTextStyles,
} from "@/lib/text-styles";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";

describe("isTextElementHidden", () => {
  it("is false without overrides", () => {
    expect(isTextElementHidden(undefined, "coupleNames")).toBe(false);
    expect(isTextElementHidden(null, "coupleNames")).toBe(false);
    expect(isTextElementHidden({}, "coupleNames")).toBe(false);
  });

  it("is true when the exact element is hidden", () => {
    expect(
      isTextElementHidden(
        { elements: { coupleNames: { hidden: true } } },
        "coupleNames",
      ),
    ).toBe(true);
  });

  it("does not cascade through style fallback keys", () => {
    // dressCodeText falls back to bodyText for styling, but hiding bodyText
    // must not hide dress code text.
    const textStyles = { elements: { bodyText: { hidden: true } } };
    expect(isTextElementHidden(textStyles, "bodyText")).toBe(true);
    expect(isTextElementHidden(textStyles, "dressCodeText")).toBe(false);
  });

  it("is false for unknown keys", () => {
    expect(
      isTextElementHidden(
        { elements: { coupleNames: { hidden: true } } },
        "notAnElement",
      ),
    ).toBe(false);
  });
});

describe("hidden is not a CSS override", () => {
  it("applyOverride ignores the hidden flag", () => {
    expect(applyOverride({ color: "red" }, { hidden: true })).toEqual({
      color: "red",
    });
  });

  it("resolved styles never carry display:none for hidden elements", () => {
    const theme = {
      displayFont: "serif",
      bodyFont: "serif",
      uiFont: "sans-serif",
      textPrimary: "#000",
      textSecondary: "#333",
      textMuted: "#666",
      accent: "#a00",
      primary: "#a00",
    } as unknown as TemplateTheme;
    const ts = resolveTextStyles(theme, {
      elements: { bodyText: { hidden: true } },
    });
    expect(ts.bodyText.display).toBeUndefined();
    expect(ts.dressCodeText.display).toBeUndefined();
  });
});

describe("EditableText visibility", () => {
  const hiddenNames: TextStyleOverrides = {
    elements: { coupleNames: { hidden: true } },
  };

  // Props objects are built separately so `children` can satisfy the
  // component prop types without tripping react/no-children-prop.
  const text = (elementKey: string, content: ReactNode) => {
    const props = { elementKey, children: content };
    return createElement(EditableText, props);
  };
  const publicPage = (textStyles: TextStyleOverrides, children: ReactNode) => {
    const props = { textStyles, children };
    return renderToStaticMarkup(createElement(SpacingStyleProvider, props));
  };
  const editor = (textStyles: TextStyleOverrides, children: ReactNode) => {
    const props = {
      textStyles,
      updateTextStyleElement: () => undefined,
      children,
    };
    return renderToStaticMarkup(createElement(InlineTextEditProvider, props));
  };
  const names = createElement("h1", null, "Constança");

  it("renders nothing on the public page when the element is hidden", () => {
    const html = publicPage(hiddenNames, [
      text("coupleNames", names),
      text("ampersand", "&"),
    ]);
    expect(html).not.toContain("Constança");
    expect(html).toContain("&amp;");
  });

  it("renders the element on the public page when not hidden", () => {
    expect(publicPage({}, text("coupleNames", names))).toContain("Constança");
  });

  it("keeps hidden elements faintly visible and selectable in the editor", () => {
    const html = editor(hiddenNames, text("coupleNames", names));
    expect(html).toContain("Constança");
    expect(html).toContain('data-text-hidden="true"');
    expect(html).toContain("opacity:0.3");
  });
});
