"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HERO_MEDIA_FIT_OPTIONS } from "@/lib/hero-media-fit";
import type { ObjectFit } from "@/lib/types";

interface HeroMediaFitSelectProps {
  /** Current stored value (`form.heroMediaFit`). Unset renders as "cover". */
  value?: ObjectFit;
  onChange: (value: ObjectFit) => void;
  /** Unique id so multiple instances across one form keep distinct labels. */
  id: string;
}

/**
 * Dropdown for the hero media `object-fit`. Used by both invitation forms.
 * Applies to the hero video and (on the standard layout) the hero image.
 */
export default function HeroMediaFitSelect({
  value,
  onChange,
  id,
}: HeroMediaFitSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Ajuste do vídeo / imagem</Label>
      <Select
        value={value ?? "cover"}
        onValueChange={(v) => onChange(v as ObjectFit)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Selecionar ajuste" />
        </SelectTrigger>
        <SelectContent>
          {HERO_MEDIA_FIT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
