"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getElementSpacing,
  spacingToStyle,
  type SpacingField,
} from "@/lib/spacing-styles";
import type {
  SpacingStyleOverrides,
  SpacingValue,
  TextStyle,
  TextStyleOverrides,
} from "@/lib/types";
import { useSpacingStyles } from "./SpacingStyleProvider";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type ElementKey = keyof NonNullable<TextStyleOverrides["elements"]>;

interface InlineTextEditContextValue {
  selectedElement: string | null;
  selectedRef: HTMLElement | null;
  selectElement: (key: string, el: HTMLElement) => void;
  clearSelection: () => void;
  updateStyle: (
    element: ElementKey,
    field: keyof TextStyle,
    value: string | number | undefined,
  ) => void;
  updateSpacing: (
    element: string,
    field: SpacingField,
    value: number | undefined,
  ) => void;
  getOverrides: (element: string) => TextStyle | undefined;
  getSpacingOverrides: (element: string) => SpacingValue | undefined;
  textStyles?: TextStyleOverrides;
  spacingStyles?: SpacingStyleOverrides;
}

const InlineTextEditContext = createContext<InlineTextEditContextValue | null>(
  null,
);

export function useInlineTextEdit() {
  return useContext(InlineTextEditContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface InlineTextEditProviderProps {
  children: ReactNode;
  updateTextStyleElement: (
    element: ElementKey,
    field: keyof TextStyle,
    value: string | number | undefined,
  ) => void;
  updateElementSpacing?: (
    element: string,
    field: SpacingField,
    value: number | undefined,
  ) => void;
  textStyles?: TextStyleOverrides;
  spacingStyles?: SpacingStyleOverrides;
}

export function InlineTextEditProvider({
  children,
  updateTextStyleElement,
  updateElementSpacing,
  textStyles,
  spacingStyles,
}: InlineTextEditProviderProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<HTMLElement | null>(null);

  const selectElement = useCallback((key: string, el: HTMLElement) => {
    setSelectedElement(key);
    setSelectedRef(el);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
    setSelectedRef(null);
  }, []);

  const getOverrides = useCallback(
    (element: string) => {
      return textStyles?.elements?.[element as ElementKey];
    },
    [textStyles],
  );

  const getSpacingOverrides = useCallback(
    (element: string) => getElementSpacing(spacingStyles, element),
    [spacingStyles],
  );

  return (
    <InlineTextEditContext.Provider
      value={{
        selectedElement,
        selectedRef,
        selectElement,
        clearSelection,
        updateStyle: updateTextStyleElement,
        updateSpacing: updateElementSpacing ?? (() => undefined),
        getOverrides,
        getSpacingOverrides,
        textStyles,
        spacingStyles,
      }}
    >
      {children}
    </InlineTextEditContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// EditableText wrapper
// ---------------------------------------------------------------------------

interface EditableTextProps {
  elementKey: string;
  children: ReactNode;
}

/**
 * Lightweight wrapper that makes a text element selectable in the admin
 * preview. When the InlineTextEditContext is not provided (e.g. on the
 * public-facing invitation page), this renders children as-is with zero
 * overhead — no extra DOM nodes, no event listeners.
 */
export function EditableText({ elementKey, children }: EditableTextProps) {
  const ctx = useInlineTextEdit();
  const spacingStyles = useSpacingStyles();
  const ref = useRef<HTMLSpanElement>(null);
  const spacing =
    ctx?.getSpacingOverrides(elementKey) ??
    getElementSpacing(spacingStyles, elementKey);
  const spacingStyle = spacingToStyle(spacing);

  // No context → public page → render children as-is
  if (!ctx) {
    if (!spacingStyle) return <>{children}</>;
    return (
      <span style={{ display: "inline-block", ...spacingStyle }}>
        {children}
      </span>
    );
  }

  const isSelected = ctx.selectedElement === elementKey;

  return (
    <span
      ref={ref}
      data-text-element={elementKey}
      onClick={(e) => {
        e.stopPropagation();
        if (ref.current) {
          ctx.selectElement(elementKey, ref.current);
        }
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.outline = "1px dashed rgba(59,130,246,0.5)";
          e.currentTarget.style.outlineOffset = "2px";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.outline = "none";
        }
      }}
      style={{
        ...(spacingStyle ? { display: "inline-block" } : {}),
        ...spacingStyle,
        cursor: "pointer",
        outline: isSelected ? "2px solid rgba(59,130,246,0.8)" : undefined,
        outlineOffset: isSelected ? 2 : undefined,
        borderRadius: 2,
      }}
    >
      {children}
    </span>
  );
}
