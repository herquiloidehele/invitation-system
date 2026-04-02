"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TextStyle, TextStyleOverrides } from "@/lib/types";

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
  getOverrides: (element: string) => TextStyle | undefined;
  textStyles?: TextStyleOverrides;
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
  textStyles?: TextStyleOverrides;
}

export function InlineTextEditProvider({
  children,
  updateTextStyleElement,
  textStyles,
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

  return (
    <InlineTextEditContext.Provider
      value={{
        selectedElement,
        selectedRef,
        selectElement,
        clearSelection,
        updateStyle: updateTextStyleElement,
        getOverrides,
        textStyles,
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
  const ref = useRef<HTMLSpanElement>(null);

  // No context → public page → render children as-is
  if (!ctx) return <>{children}</>;

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
