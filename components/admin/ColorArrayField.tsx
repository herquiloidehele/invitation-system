"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Editable list of hex color swatches (color picker + text input + remove). */
export function ColorArrayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-2">
        {value.map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={color.startsWith("#") ? color : "#000000"}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="h-7 w-7 cursor-pointer rounded border p-0"
            />
            <Input
              value={color}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, "#D4AF37"])}
        className="gap-1"
      >
        <Plus className="size-3" />
        Adicionar cor
      </Button>
    </div>
  );
}
