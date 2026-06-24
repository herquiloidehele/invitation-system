"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import MediaUpload from "@/components/admin/MediaUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GiftItem } from "@/lib/types";

export default function GiftsListEditor({
  value,
  onChange,
}: {
  value: GiftItem[] | undefined;
  onChange: (next: GiftItem[]) => void;
}) {
  const items = value ?? [];

  const add = () =>
    onChange([...items, { id: `gift-${Date.now()}`, name: "" }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<GiftItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs">Presentes ({items.length})</Label>

      {items.map((it, i) => (
        <div
          key={it.id}
          className="rounded-lg border border-border p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Presente {i + 1}
            </span>
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={i === 0}
                onClick={() => move(i, "up")}
                aria-label="Mover para cima"
              >
                <ChevronUp size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={i === items.length - 1}
                onClick={() => move(i, "down")}
                aria-label="Mover para baixo"
              >
                <ChevronDown size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => remove(i)}
                aria-label="Remover"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          <MediaUpload
            kind="image"
            maxSizeMB={3}
            value={it.imageUrl || undefined}
            onUpload={(url) => update(i, { imageUrl: url })}
            onClear={() => update(i, { imageUrl: "" })}
          />

          <Input
            value={it.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Nome do presente"
          />
          <Input
            value={it.price ?? ""}
            onChange={(e) => update(i, { price: e.target.value })}
            placeholder="Preço (opcional), ex.: R$ 350"
          />
          <Input
            value={it.link ?? ""}
            onChange={(e) => update(i, { link: e.target.value })}
            placeholder="Link (opcional), ex.: https://..."
          />
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus size={14} className="mr-1.5" />
        Adicionar presente
      </Button>
    </div>
  );
}
