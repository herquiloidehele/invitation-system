"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useInlineCardEdit } from "@/components/shared/EditableCard";
import { RotateCcw, X } from "lucide-react";
import type { CardSectionKey, CardStyle } from "@/lib/types";

// ---------------------------------------------------------------------------
// Toolbar positioning (same logic as TextStyleToolbar)
// ---------------------------------------------------------------------------

interface ToolbarPosition {
  top: number;
  left: number;
  placement: "above" | "below";
}

function computePosition(
  targetEl: HTMLElement,
  toolbarEl: HTMLElement,
): ToolbarPosition {
  const targetRect = targetEl.getBoundingClientRect();
  const toolbarRect = toolbarEl.getBoundingClientRect();
  const gap = 8;

  // Center horizontally relative to target, clamped to viewport
  let left = targetRect.left + targetRect.width / 2 - toolbarRect.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - toolbarRect.width - 8));

  // Prefer above the element
  const topAbove = targetRect.top - toolbarRect.height - gap;
  if (topAbove > 8) {
    return { top: topAbove, left, placement: "above" };
  }

  // Fall back below the element
  const topBelow = targetRect.bottom + gap;
  return { top: topBelow, left, placement: "below" };
}

// ---------------------------------------------------------------------------
// CardStyleToolbar
// ---------------------------------------------------------------------------

export default function CardStyleToolbar() {
  const ctx = useInlineCardEdit();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<ToolbarPosition | null>(null);

  // ---- Reposition on selection change, scroll, resize --------------------
  const reposition = useCallback(() => {
    if (!ctx?.selectedRef || !toolbarRef.current) {
      setPos(null);
      return;
    }
    setPos(computePosition(ctx.selectedRef, toolbarRef.current));
  }, [ctx?.selectedRef]);

  // Initial position + layout effect to avoid flash
  useLayoutEffect(() => {
    reposition();
  }, [reposition]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!ctx?.selectedCard) return;

    const handler = () => reposition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [ctx?.selectedCard, reposition]);

  // ---- Escape key to dismiss --------------------------------------------
  useEffect(() => {
    if (!ctx?.selectedCard) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ctx.clearSelection();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [ctx]);

  // ---- Click outside to dismiss -----------------------------------------
  useEffect(() => {
    if (!ctx?.selectedCard) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't dismiss if clicking inside toolbar
      if (toolbarRef.current?.contains(target)) return;
      // Don't dismiss if clicking on a card section element
      if ((target as HTMLElement).closest?.("[data-card-section]")) return;
      ctx.clearSelection();
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [ctx]);

  // ---- Nothing selected → render nothing --------------------------------
  if (!ctx?.selectedCard) return null;

  const sectionKey = ctx.selectedCard as CardSectionKey;
  const overrides: CardStyle = ctx.getOverrides(sectionKey) ?? {};

  // ---- Handlers ---------------------------------------------------------
  const set = (field: keyof CardStyle, value: string | number | undefined) => {
    ctx.updateStyle(sectionKey, field, value);
  };

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        zIndex: 9999,
        opacity: pos ? 1 : 0,
        transition: "opacity 0.1s ease",
      }}
      className="flex items-center gap-1.5 rounded-lg border bg-popover px-2 py-1.5 shadow-xl"
    >
      {/* Background color */}
      <label
        title="Cor de fundo"
        className="relative flex h-7 items-center gap-1.5 cursor-pointer rounded border bg-background px-1.5"
      >
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          Fundo
        </span>
        <div
          className="h-4 w-4 rounded-sm border"
          style={{ backgroundColor: overrides.cardBg ?? "#ffffff" }}
        />
        <input
          type="color"
          value={overrides.cardBg ?? "#ffffff"}
          onChange={(e) => set("cardBg", e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Border color */}
      <label
        title="Cor da borda"
        className="relative flex h-7 items-center gap-1.5 cursor-pointer rounded border bg-background px-1.5"
      >
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          Borda
        </span>
        <div
          className="h-4 w-4 rounded-sm border"
          style={{ backgroundColor: overrides.cardBorder ?? "#cccccc" }}
        />
        <input
          type="color"
          value={overrides.cardBorder ?? "#cccccc"}
          onChange={(e) => set("cardBorder", e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Border radius */}
      <div className="flex items-center gap-1" title="Raio da borda (px)">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          Raio
        </span>
        <input
          type="number"
          min={0}
          max={60}
          step={1}
          value={overrides.borderRadius ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            set("borderRadius", v === "" ? undefined : Number(v));
          }}
          placeholder="Auto"
          className="h-7 w-12 rounded border bg-background px-1.5 text-center text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Reset this section */}
      <button
        type="button"
        title="Limpar estilos desta secção"
        onClick={() => {
          set("cardBg", undefined);
          set("cardBorder", undefined);
          set("borderRadius", undefined);
        }}
        className="flex h-7 w-7 items-center justify-center rounded border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <RotateCcw className="size-3.5" />
      </button>

      {/* Close / deselect */}
      <button
        type="button"
        title="Fechar"
        onClick={() => ctx.clearSelection()}
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
