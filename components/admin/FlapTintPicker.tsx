"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";

/**
 * Tint color picker used to paint the top/bottom flap images while preserving
 * their internal texture, shading and folds. The tint is implemented as a
 * mask-clipped color overlay blended over the original image with
 * `mix-blend-mode: multiply`. Empty / undefined value disables tinting and
 * the original image colors are shown.
 *
 * Includes an optional thumbnail preview that uses the exact same technique
 * as the runtime renderer so the user sees the real result before saving.
 */
export function FlapTintPicker({
  label,
  value,
  onChange,
  onClear,
  previewSrc,
}: {
  label: string;
  /** Hex color (e.g. "#A86E4F") or empty/undefined to disable tinting. */
  value?: string;
  onChange: (hex: string) => void;
  onClear: () => void;
  /** Optional flap image URL to render a tinted preview thumbnail. */
  previewSrc?: string;
}) {
  const hasTint = !!value && /^#[0-9a-fA-F]{6}$/.test(value);
  const safeColor = hasTint ? value! : "#000000";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeColor}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded border cursor-pointer shrink-0"
          title="Escolher cor"
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Sem tonalização (cor original)"
          className="font-mono text-sm h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
        {hasTint && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground"
            onClick={onClear}
          >
            Repor
          </Button>
        )}
      </div>
      {previewSrc && hasTint && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Pré-visualização:</span>
          <div
            className="relative h-12 w-20 rounded border bg-neutral-50 overflow-hidden"
            style={{ isolation: "isolate" }}
          >
            <Image
              src={previewSrc}
              fill
              alt=""
              sizes="80px"
              className="object-contain"
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundColor: value!,
                WebkitMaskImage: `url("${previewSrc}")`,
                maskImage: `url("${previewSrc}")`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                mixBlendMode: "multiply",
              }}
            />
          </div>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground leading-snug">
        A cor é misturada sobre a imagem original, preservando textura e
        sombreado. Cores claras dão tons sutis; cores escuras tingem mais.
      </p>
    </div>
  );
}
