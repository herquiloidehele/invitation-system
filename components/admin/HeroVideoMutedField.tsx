"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface HeroVideoMutedFieldProps {
  id: string;
  value?: boolean;
  onChange: (value: boolean) => void;
}

export default function HeroVideoMutedField({
  id,
  value,
  onChange,
}: HeroVideoMutedFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
      <div className="space-y-0.5">
        <Label htmlFor={id}>Vídeo sem som</Label>
        <p className="text-xs text-muted-foreground">
          Desative para iniciar o vídeo com som quando o navegador permitir.
        </p>
      </div>
      <Switch
        id={id}
        checked={value !== false}
        onCheckedChange={onChange}
      />
    </div>
  );
}
