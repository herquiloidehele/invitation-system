"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LANDING_FEATURE_MAX_ITEMS,
  LANDING_FEATURE_MAX_LENGTH,
} from "@/lib/landing-gallery-settings";

type LandingFeatureListEditorProps = {
  title: string;
  value: string[];
  disabled: boolean;
  onChange: (next: string[]) => Promise<void>;
};

export function LandingFeatureListEditor({
  title,
  value,
  disabled,
  onChange,
}: LandingFeatureListEditorProps) {
  const [draft, setDraft] = useState("");
  const normalizedDraft = draft.trim();
  const duplicate = value.some(
    (item) => item.toLocaleLowerCase() === normalizedDraft.toLocaleLowerCase(),
  );
  const error =
    normalizedDraft.length > LANDING_FEATURE_MAX_LENGTH
      ? `Máximo de ${LANDING_FEATURE_MAX_LENGTH} caracteres.`
      : duplicate
        ? "Esta funcionalidade já existe."
        : null;
  const atLimit = value.length >= LANDING_FEATURE_MAX_ITEMS;

  async function add() {
    if (!normalizedDraft || error || atLimit) return;
    await onChange([...value, normalizedDraft]);
    setDraft("");
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;

    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    await onChange(next);
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">
          Até {LANDING_FEATURE_MAX_ITEMS} funcionalidades, por ordem de
          exibição.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={draft}
          maxLength={LANDING_FEATURE_MAX_LENGTH + 1}
          disabled={disabled || atLimit}
          placeholder="Ex.: RSVP integrado"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void add();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={
            disabled || atLimit || !normalizedDraft || Boolean(error)
          }
          onClick={() => void add()}
        >
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {atLimit ? (
        <p className="text-xs text-muted-foreground">
          Limite de {LANDING_FEATURE_MAX_ITEMS} funcionalidades atingido.
        </p>
      ) : null}
      <ul className="space-y-2">
        {value.map((label, index) => (
          <li
            key={label}
            className="flex items-center gap-1 rounded-md border bg-card p-2"
          >
            <span className="min-w-0 flex-1 truncate px-1 text-sm">
              {label}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || index === 0}
              aria-label={`Mover ${label} para cima`}
              onClick={() => void move(index, -1)}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || index === value.length - 1}
              aria-label={`Mover ${label} para baixo`}
              onClick={() => void move(index, 1)}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={`Remover ${label}`}
              className="text-destructive hover:text-destructive"
              onClick={() =>
                void onChange(
                  value.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
