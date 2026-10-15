"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeHeroVideoRotation } from "@/lib/minimalism-brown";
import type { HeroVideoRotation } from "@/lib/types";

// String values: Select items are keyed by string. Passing them as `items`
// makes the trigger show the label instead of the raw value ("270").
const OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "Sem rotação" },
  { value: "90", label: "90° ↻ (sentido horário)" },
  { value: "180", label: "180° (de pernas para o ar)" },
  { value: "270", label: "90° ↺ (sentido anti-horário)" },
];

interface HeroVideoRotationSelectProps {
  /** Current stored value (`form.heroVideoRotation`). Unset renders as 0. */
  value?: HeroVideoRotation;
  onChange: (value: HeroVideoRotation) => void;
  id: string;
}

/**
 * Turns a video recorded on its side upright inside the minimalism-brown
 * polaroid. Display only: the uploaded file is not changed.
 */
export default function HeroVideoRotationSelect({
  value,
  onChange,
  id,
}: HeroVideoRotationSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Rodar vídeo</Label>
      <Select
        items={OPTIONS}
        value={String(value ?? 0)}
        onValueChange={(v) => onChange(normalizeHeroVideoRotation(Number(v)))}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Selecionar rotação" />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Para vídeos gravados de lado. Só muda a forma como o vídeo aparece na
        polaroid; o ficheiro não é alterado.
      </p>
    </div>
  );
}
