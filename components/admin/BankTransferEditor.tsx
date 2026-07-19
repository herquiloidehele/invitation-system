"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BankTransferDetail } from "@/lib/types";

export default function BankTransferEditor({
  value,
  sourceValue,
  structureLocked = false,
  onChange,
}: {
  value: BankTransferDetail[] | undefined;
  sourceValue?: BankTransferDetail[];
  structureLocked?: boolean;
  onChange: (next: BankTransferDetail[]) => void;
}) {
  const rows = value ?? [];
  const sourceById = new Map(
    (sourceValue ?? []).map((item) => [item.id, item]),
  );

  const add = () =>
    onChange([
      ...rows,
      {
        id: `bank-${crypto.randomUUID()}`,
        label: "",
        value: "",
        copyable: true,
      },
    ]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<BankTransferDetail>) =>
    onChange(rows.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs">Transferência bancária ({rows.length})</Label>
      {structureLocked && (
        <p className="text-xs text-muted-foreground">
          A estrutura é editada em Português.
        </p>
      )}

      {rows.map((it, i) => (
        <div
          key={it.id}
          className="rounded-lg border border-border p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Dado {i + 1}</span>
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={structureLocked || i === 0}
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
                disabled={structureLocked || i === rows.length - 1}
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
                disabled={structureLocked}
                onClick={() => remove(i)}
                aria-label="Remover"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          <Input
            value={it.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder={sourceById.get(it.id)?.label || "Rótulo, ex.: IBAN"}
          />
          <Input
            value={it.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="Valor, ex.: GB82 WEST 1234 5698 7654 32"
          />
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Botão copiar
            </Label>
            <Switch
              checked={it.copyable ?? false}
              onCheckedChange={(v) => update(i, { copyable: v })}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={structureLocked}
        onClick={add}
      >
        <Plus size={14} className="mr-1.5" />
        Adicionar dado bancário
      </Button>
    </div>
  );
}
