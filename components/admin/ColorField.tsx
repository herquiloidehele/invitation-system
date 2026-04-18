"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Color field — clickable swatch that opens native color picker + text input
// Shared utility for model-specific style editors.
// ---------------------------------------------------------------------------

function extractHex(value: string): string {
  const m = value.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  if (m) return m[0];
  const rgba = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgba) {
    const r = parseInt(rgba[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgba[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgba[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function replaceColorInValue(original: string, newHex: string): string {
  if (/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/.test(original)) {
    return original.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/, newHex);
  }
  const rgbaMatch = original.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(.*)\)/);
  if (rgbaMatch) {
    const rgb = hexToRgb(newHex);
    if (rgb) {
      const tail = rgbaMatch[1];
      return `rgba(${rgb.r},${rgb.g},${rgb.b}${tail})`;
    }
  }
  return newHex;
}

export function ColorField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const hex = extractHex(value);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <div className="flex items-center gap-2">
        <label
          className="relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-input shadow-sm transition-opacity hover:opacity-80"
          title="Escolher cor"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }}
        >
          <span
            className="absolute inset-0"
            style={{ background: value || "transparent" }}
          />
          <input
            type="color"
            value={hex || "#ffffff"}
            onChange={(e) => {
              if (hex && value !== hex) {
                onChange(replaceColorInValue(value, e.target.value));
              } else {
                onChange(e.target.value);
              }
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "#ffffff"}
          className="font-mono text-xs h-8"
        />
      </div>
    </div>
  );
}
