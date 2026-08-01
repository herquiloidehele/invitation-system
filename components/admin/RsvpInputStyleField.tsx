"use client";

import { Label } from "@/components/ui/label";
import type { RsvpInputStyle } from "@/lib/rsvp-input-styles";

const RSVP_INPUT_STYLE_OPTIONS: {
  value: RsvpInputStyle;
  label: string;
  description: string;
}[] = [
  { value: "default", label: "Padrão", description: "Borda e fundo" },
  {
    value: "minimal",
    label: "Minimalista",
    description: "Apenas linha inferior",
  },
  {
    value: "soft",
    label: "Suave",
    description: "Fundo leve e sombra discreta",
  },
];

export function RsvpInputStyleField({
  value,
  onChange,
}: {
  value: RsvpInputStyle | undefined;
  onChange: (value: RsvpInputStyle) => void;
}) {
  return (
    <div className="space-y-1.5 rounded-lg border border-border p-3">
      <Label htmlFor="rsvpInputStyle">Estilo dos campos RSVP</Label>
      <p className="text-xs text-muted-foreground">
        Escolha o visual dos campos no modal e na página de confirmação.
      </p>
      <select
        id="rsvpInputStyle"
        value={value ?? "default"}
        onChange={(event) => {
          const next = RSVP_INPUT_STYLE_OPTIONS.find(
            (option) => option.value === event.target.value,
          );
          if (next) onChange(next.value);
        }}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {RSVP_INPUT_STYLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} — {option.description}
          </option>
        ))}
      </select>
    </div>
  );
}
