"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import type { Direction } from "@/worker/lib/directions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Pull a usable CSS colour out of a palette entry. The model is asked for bare
 * hex, but it sometimes annotates ("#EDE6DA (areia lavada)"), which would be an
 * invalid CSS value and render an empty swatch.
 */
function swatchColor(entry: string): string | null {
  return entry.match(/#[0-9a-f]{3,8}\b/i)?.[0] ?? null;
}

export default function DirectionsCards({
  directions,
  disabled,
  onPick,
  onAnotherRound,
}: {
  directions: Direction[];
  disabled: boolean;
  onPick: (d: Direction) => void;
  onAnotherRound: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Escolha uma direção para a construir — ou peça outra ronda.
      </p>
      <div className="grid gap-2">
        {directions.map((d) => (
          <button
            key={d.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(d)}
            className="rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{d.name}</span>
              <span className="flex shrink-0 gap-1">
                {d.palette
                  .map(swatchColor)
                  .filter((c): c is string => c !== null)
                  .slice(0, 5)
                  .map((c, i) => (
                    <span
                      key={`${d.id}-${i}`}
                      className="size-4 rounded-full border"
                      // Dynamic data, not a design token — the one legitimate
                      // inline style in this codebase.
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
              </span>
            </div>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {d.typography}
            </p>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {d.composition}
            </p>
            <p className="mt-1 line-clamp-2 text-xs">{d.rationale}</p>
            {/* Older persisted directions predate this field — hence the guard. */}
            {(d.signatureDetails ?? []).length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                {(d.signatureDetails ?? []).map((sd, i) => (
                  <li key={`${d.id}-s${i}`} className="line-clamp-1">
                    {sd}
                  </li>
                ))}
              </ul>
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Opcional: mais quente, menos formal…"
          disabled={disabled}
        />
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => onAnotherRound(note.trim())}
        >
          <RefreshCw className="size-4" /> Nenhuma destas
        </Button>
      </div>
    </div>
  );
}
