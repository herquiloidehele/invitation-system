"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowDownUp, RotateCcw, X } from "lucide-react";
import { useInlineCardEdit } from "@/components/shared/EditableCard";
import { useInlineTextEdit } from "@/components/shared/EditableText";
import type { SpacingField, SpacingTarget } from "@/lib/spacing-styles";

interface ToolbarPosition {
  top: number;
  left: number;
}

function computePosition(
  targetEl: HTMLElement,
  toolbarEl: HTMLElement,
): ToolbarPosition {
  const targetRect = targetEl.getBoundingClientRect();
  const toolbarRect = toolbarEl.getBoundingClientRect();
  const gap = 8;
  let left = targetRect.left + targetRect.width / 2 - toolbarRect.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - toolbarRect.width - 8));
  const topAbove = targetRect.top - toolbarRect.height - gap;
  return {
    left,
    top: topAbove > 8 ? topAbove : targetRect.bottom + gap,
  };
}

function SpacingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="flex items-center gap-1" title={`${label} (px)`}>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <input
        type="number"
        min={-80}
        max={160}
        step={1}
        value={value ?? ""}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next === "" ? undefined : Number(next));
        }}
        placeholder="Auto"
        className="h-7 w-14 rounded border bg-background px-1.5 text-center text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}

export default function SpacingStyleToolbar() {
  const textCtx = useInlineTextEdit();
  const cardCtx = useInlineCardEdit();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<ToolbarPosition | null>(null);

  const selectedText = textCtx?.selectedElement ?? null;
  const selectedCard = selectedText ? null : (cardCtx?.selectedCard ?? null);
  const selectedRef = selectedText ? textCtx?.selectedRef : cardCtx?.selectedRef;
  const mode: SpacingTarget | null = selectedText
    ? "elements"
    : selectedCard
      ? "sections"
      : null;
  const key = selectedText ?? selectedCard;
  const ctx = selectedText ? textCtx : cardCtx;
  const spacing = key ? ctx?.getSpacingOverrides(key) : undefined;

  const reposition = useCallback(() => {
    if (!selectedRef || !toolbarRef.current) {
      setPos(null);
      return;
    }
    setPos(computePosition(selectedRef, toolbarRef.current));
  }, [selectedRef]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(reposition);
    return () => window.cancelAnimationFrame(frame);
  }, [reposition]);

  useEffect(() => {
    if (!key) return;
    const handler = () => reposition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [key, reposition]);

  if (!mode || !key || !ctx) return null;

  const set = (field: SpacingField, value: number | undefined) => {
    ctx.updateSpacing(key, field, value);
  };

  const clear = () => {
    set("spaceBefore", undefined);
    set("spaceAfter", undefined);
  };

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        zIndex: 10000,
        opacity: pos ? 1 : 0,
        transition: "opacity 0.1s ease",
      }}
      className="flex items-center gap-1.5 rounded-lg border bg-popover px-2 py-1.5 shadow-xl"
    >
      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
        <ArrowDownUp className="size-3.5" />
        {mode === "sections" ? "Secção" : "Elemento"}
      </div>
      <div className="h-5 w-px bg-border" />
      <SpacingInput
        label="Acima"
        value={spacing?.spaceBefore}
        onChange={(value) => set("spaceBefore", value)}
      />
      <SpacingInput
        label="Abaixo"
        value={spacing?.spaceAfter}
        onChange={(value) => set("spaceAfter", value)}
      />
      <div className="h-5 w-px bg-border" />
      <button
        type="button"
        title="Limpar espaçamento"
        onClick={clear}
        className="flex h-7 w-7 items-center justify-center rounded border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <RotateCcw className="size-3.5" />
      </button>
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
