"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import {
  heroTextTimePartsToSeconds,
  heroTextTimingRangeError,
  secondsToHeroTextTimeParts,
  type HeroTextTimeParts,
} from "@/lib/hero-text-timing";
import type { HeroTextBlock } from "@/lib/types";

interface HeroTextTimingFieldsProps {
  block: HeroTextBlock;
  onChange: (patch: Partial<HeroTextBlock>) => void;
}

const EMPTY_TIME: HeroTextTimeParts = { minutes: "", seconds: "" };
const FORMAT_ERROR = "Usa minutos inteiros e segundos entre 0 e 59.";
const START_REQUIRED_ERROR = "Define primeiro quando o texto deve aparecer.";
const RANGE_ERROR = "O fim deve ser posterior ao início.";

function TimeInputs({
  id,
  action,
  value,
  onChange,
}: {
  id: string;
  action: "aparecer" | "desaparecer";
  value: HeroTextTimeParts;
  onChange: (value: HeroTextTimeParts) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label htmlFor={`${id}-minutes`} className="text-xs">
          Min
        </Label>
        <input
          aria-label={`Minutos para ${action}`}
          min={0}
          step={1}
          value={value.minutes}
          onChange={(event) =>
            onChange({ ...value, minutes: event.target.value })
          }
          id={`${id}-minutes`}
          type="number"
          inputMode="numeric"
          className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${id}-seconds`} className="text-xs">
          Seg
        </Label>
        <input
          aria-label={`Segundos para ${action}`}
          min={0}
          max={59}
          step={1}
          value={value.seconds}
          onChange={(event) =>
            onChange({ ...value, seconds: event.target.value })
          }
          id={`${id}-seconds`}
          type="number"
          inputMode="numeric"
          className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

export default function HeroTextTimingFields({
  block,
  onChange,
}: HeroTextTimingFieldsProps) {
  const [start, setStart] = useState(() =>
    secondsToHeroTextTimeParts(block.startSeconds),
  );
  const [end, setEnd] = useState(() =>
    secondsToHeroTextTimeParts(block.endSeconds),
  );
  const [startError, setStartError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);

  function updateStart(next: HeroTextTimeParts) {
    setStart(next);
    const parsed = heroTextTimePartsToSeconds(next.minutes, next.seconds);
    if (parsed.error) {
      setStartError(FORMAT_ERROR);
      return;
    }
    setStartError(null);

    if (parsed.value === undefined) {
      setEnd(EMPTY_TIME);
      setEndError(null);
      onChange({ startSeconds: undefined, endSeconds: undefined });
      return;
    }

    const parsedEnd = heroTextTimePartsToSeconds(end.minutes, end.seconds);
    if (parsedEnd.error) {
      setEndError(FORMAT_ERROR);
      onChange({ startSeconds: parsed.value, endSeconds: undefined });
      return;
    }
    if (
      parsedEnd.value !== undefined &&
      heroTextTimingRangeError(parsed.value, parsedEnd.value)
    ) {
      setEndError(RANGE_ERROR);
      onChange({ startSeconds: parsed.value, endSeconds: undefined });
      return;
    }

    setEndError(null);
    onChange({ startSeconds: parsed.value });
  }

  function updateEnd(next: HeroTextTimeParts) {
    setEnd(next);
    const parsed = heroTextTimePartsToSeconds(next.minutes, next.seconds);
    if (parsed.error) {
      setEndError(FORMAT_ERROR);
      return;
    }
    if (parsed.value === undefined) {
      setEndError(null);
      onChange({ endSeconds: undefined });
      return;
    }

    const parsedStart = heroTextTimePartsToSeconds(
      start.minutes,
      start.seconds,
    );
    const rangeError = heroTextTimingRangeError(parsedStart.value, parsed.value);
    if (rangeError) {
      setEndError(
        rangeError === "start-required" ? START_REQUIRED_ERROR : RANGE_ERROR,
      );
      return;
    }

    setEndError(null);
    onChange({ endSeconds: parsed.value });
  }

  return (
    <fieldset className="space-y-2 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">Tempo no vídeo</legend>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Aparecer</Label>
          <TimeInputs
            id={`${block.id}-start`}
            action="aparecer"
            value={start}
            onChange={updateStart}
          />
          {startError && (
            <p className="text-xs text-destructive">{startError}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Desaparecer (opcional)</Label>
          <TimeInputs
            id={`${block.id}-end`}
            action="desaparecer"
            value={end}
            onChange={updateEnd}
          />
          {endError && (
            <p className="text-xs text-destructive">{endError}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Deixa ambos vazios para manter o comportamento atual.
      </p>
    </fieldset>
  );
}
