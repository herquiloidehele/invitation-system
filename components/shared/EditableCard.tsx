"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CardSectionKey, CardStyle } from "@/lib/types";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface InlineCardEditContextValue {
  selectedCard: string | null;
  selectedRef: HTMLElement | null;
  selectCard: (sectionKey: string, el: HTMLElement) => void;
  clearSelection: () => void;
  updateStyle: (
    section: CardSectionKey,
    field: keyof CardStyle,
    value: string | number | undefined,
  ) => void;
  getOverrides: (section: string) => CardStyle | undefined;
}

const InlineCardEditContext = createContext<InlineCardEditContextValue | null>(
  null,
);

export function useInlineCardEdit() {
  return useContext(InlineCardEditContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface InlineCardEditProviderProps {
  children: ReactNode;
  updateCardStyle: (
    section: CardSectionKey,
    field: keyof CardStyle,
    value: string | number | undefined,
  ) => void;
  cardStyles?: Partial<Record<CardSectionKey, CardStyle>>;
}

export function InlineCardEditProvider({
  children,
  updateCardStyle,
  cardStyles,
}: InlineCardEditProviderProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<HTMLElement | null>(null);

  const selectCard = useCallback((key: string, el: HTMLElement) => {
    setSelectedCard(key);
    setSelectedRef(el);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCard(null);
    setSelectedRef(null);
  }, []);

  const getOverrides = useCallback(
    (section: string) => {
      return cardStyles?.[section as CardSectionKey];
    },
    [cardStyles],
  );

  return (
    <InlineCardEditContext.Provider
      value={{
        selectedCard,
        selectedRef,
        selectCard,
        clearSelection,
        updateStyle: updateCardStyle,
        getOverrides,
      }}
    >
      {children}
    </InlineCardEditContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// EditableCard wrapper
// ---------------------------------------------------------------------------

interface EditableCardProps {
  sectionKey: string;
  children: ReactNode;
}

/**
 * Lightweight wrapper that makes a card element selectable in the admin
 * preview. When the InlineCardEditContext is not provided (e.g. on the
 * public-facing invitation page), this renders children as-is with zero
 * overhead — no extra DOM nodes, no event listeners.
 */
export function EditableCard({ sectionKey, children }: EditableCardProps) {
  const ctx = useInlineCardEdit();
  const ref = useRef<HTMLDivElement>(null);

  // No context → public page → render children as-is
  if (!ctx) return <>{children}</>;

  const isSelected = ctx.selectedCard === sectionKey;

  return (
    <div
      ref={ref}
      data-card-section={sectionKey}
      onClick={(e) => {
        // Don't capture clicks that are on text elements (let EditableText handle those)
        if ((e.target as HTMLElement).closest?.("[data-text-element]")) return;
        e.stopPropagation();
        if (ref.current) {
          ctx.selectCard(sectionKey, ref.current);
        }
      }}
      style={{
        cursor: "pointer",
        outline: isSelected ? "2px solid rgba(59,130,246,0.8)" : undefined,
        outlineOffset: isSelected ? 2 : undefined,
        borderRadius: 4,
        position: "relative",
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
    >
      {children}
    </div>
  );
}
