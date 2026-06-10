"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useInlineTextEdit } from "@/components/shared/EditableText";
import FontPicker from "@/components/admin/FontPicker";
import { extractFamilyName } from "@/lib/google-fonts";
import { useDynamicFont } from "@/hooks/useDynamicFont";
import { RotateCcw, X } from "lucide-react";
import type { TextStyle, TextStyleOverrides } from "@/lib/types";

// ---------------------------------------------------------------------------
// Font weight options
// ---------------------------------------------------------------------------

const WEIGHT_OPTIONS: { label: string; value: string }[] = [
  { label: "Fina", value: "300" },
  { label: "Normal", value: "400" },
  { label: "Média", value: "500" },
  { label: "Semi-negrito", value: "600" },
  { label: "Negrito", value: "700" },
];

// ---------------------------------------------------------------------------
// Toolbar positioning
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
// TextStyleToolbar
// ---------------------------------------------------------------------------

type ElementKey = keyof NonNullable<TextStyleOverrides["elements"]>;

export default function TextStyleToolbar() {
  const ctx = useInlineTextEdit();
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
    if (!ctx?.selectedElement) return;

    const handler = () => reposition();
    window.addEventListener("scroll", handler, true); // capture scroll in any container
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [ctx?.selectedElement, reposition]);

  // ---- Escape key to dismiss --------------------------------------------
  useEffect(() => {
    if (!ctx?.selectedElement) return;
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
    if (!ctx?.selectedElement) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't dismiss if clicking inside toolbar or on an editable text element
      if (toolbarRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-text-element]")) return;
      // Don't dismiss if clicking inside a font picker dropdown
      if ((target as HTMLElement).closest?.("[data-font-picker-dropdown]"))
        return;
      ctx.clearSelection();
    };
    // Use setTimeout so the current click event that selected an element
    // doesn't immediately dismiss it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [ctx]);

  // ---- Nothing selected → render nothing --------------------------------
  if (!ctx?.selectedElement) return null;

  const elementKey = ctx.selectedElement as ElementKey;
  const overrides: TextStyle = ctx.getOverrides(elementKey) ?? {};

  // ---- Handlers ---------------------------------------------------------
  const set = (field: keyof TextStyle, value: string | number | undefined) => {
    ctx.updateStyle(elementKey, field, value);
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
      {/* Font picker — compact trigger */}
      <ToolbarFontPicker
        value={overrides.fontFamily ?? ""}
        onChange={(v) => set("fontFamily", v || undefined)}
      />

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Font size */}
      <input
        type="number"
        min={8}
        max={200}
        step={1}
        value={overrides.fontSize ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          set("fontSize", v === "" ? undefined : Number(v));
        }}
        placeholder="Tam."
        title="Tamanho (px)"
        className="h-7 w-12 rounded border bg-background px-1.5 text-center text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
      />

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Font weight */}
      <select
        value={overrides.fontWeight?.toString() ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          set("fontWeight", v === "" ? undefined : v);
        }}
        title="Espessura"
        className="h-7 rounded border bg-background px-1 text-xs outline-none focus:ring-1 focus:ring-ring cursor-pointer"
      >
        <option value="">Peso</option>
        {WEIGHT_OPTIONS.map((w) => (
          <option key={w.value} value={w.value}>
            {w.label}
          </option>
        ))}
      </select>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Color picker */}
      <label
        title="Cor do texto"
        className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded border bg-background"
      >
        <div
          className="h-4 w-4 rounded-sm border"
          style={{ backgroundColor: overrides.color ?? "#000000" }}
        />
        <input
          type="color"
          value={overrides.color ?? "#000000"}
          onChange={(e) => set("color", e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Font style */}
      <select
        value={overrides.fontStyle ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          set("fontStyle", v === "" ? undefined : v);
        }}
        title="Estilo da fonte"
        className="h-7 rounded border bg-background px-1 text-xs outline-none focus:ring-1 focus:ring-ring cursor-pointer"
      >
        <option value="">Estilo</option>
        <option value="normal">Normal</option>
        <option value="italic">Itálico</option>
        <option value="oblique">Oblíquo</option>
      </select>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Letter spacing */}
      <input
        type="number"
        min={-5}
        max={20}
        step={0.1}
        value={overrides.letterSpacing ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          set("letterSpacing", v === "" ? undefined : Number(v));
        }}
        placeholder="Esp."
        title="Espaçamento entre letras (px)"
        className="h-7 w-12 rounded border bg-background px-1.5 text-center text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
      />

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Reset this element */}
      <button
        type="button"
        title="Limpar estilos deste elemento"
        onClick={() => {
          // Clear all fields for this element
          set("fontFamily", undefined);
          set("fontSize", undefined);
          set("fontWeight", undefined);
          set("fontStyle", undefined);
          set("color", undefined);
          set("letterSpacing", undefined);
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

// ---------------------------------------------------------------------------
// Compact font picker trigger for the toolbar
// ---------------------------------------------------------------------------

function ToolbarFontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayName = value ? extractFamilyName(value) : "";

  // Load the selected font dynamically so the trigger renders correctly
  useDynamicFont(value || null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex h-7 max-w-[140px] items-center gap-1 rounded border bg-background px-2 text-xs transition-colors hover:bg-accent"
        title="Fonte"
      >
        <span
          className="truncate"
          style={
            value
              ? { fontFamily: value, fontSize: 12 }
              : { color: "var(--muted-foreground)", fontSize: 11 }
          }
        >
          {displayName || "Fonte"}
        </span>
      </button>

      {open && (
        <div
          data-font-picker-dropdown
          className="absolute left-0 top-full mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <FontPicker
            label=""
            value={value}
            onChange={(v) => {
              onChange(v);
              setOpen(false);
            }}
            optional
          />
        </div>
      )}
    </div>
  );
}
