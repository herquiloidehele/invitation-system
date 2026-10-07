"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RsvpCustomFieldOption } from "@/lib/types";

/**
 * The shared select popup is exactly as wide as its trigger, which clips the
 * longer labels used in this builder. Let it grow to fit them instead.
 */
export const RSVP_BUILDER_SELECT_POPUP_CLASS =
  "w-auto min-w-(--anchor-width) max-w-80";

export function createRsvpOption(): RsvpCustomFieldOption {
  return { id: `rsvp-option-${crypto.randomUUID()}`, label: "" };
}

/** Choice labels for a radio/select field or a select column of a list. */
export function RsvpCustomOptionsEditor({
  options,
  sourceOptions,
  structureLocked = false,
  onChange,
}: {
  options: RsvpCustomFieldOption[];
  sourceOptions?: RsvpCustomFieldOption[];
  structureLocked?: boolean;
  onChange: (options: RsvpCustomFieldOption[]) => void;
}) {
  const sourceLabel = (optionId: string) =>
    sourceOptions?.find((option) => option.id === optionId)?.label;

  return (
    <div className="space-y-2">
      <Label>Opções</Label>
      {options.map((option, optionIndex) => (
        <div key={option.id} className="flex gap-2">
          <Input
            value={option.label}
            onChange={(event) =>
              onChange(
                options.map((item) =>
                  item.id === option.id
                    ? { ...item, label: event.target.value }
                    : item,
                ),
              )
            }
            placeholder={sourceLabel(option.id) || `Opção ${optionIndex + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            disabled={structureLocked}
            onClick={() =>
              onChange(options.filter((item) => item.id !== option.id))
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={structureLocked}
        onClick={() => onChange([...options, createRsvpOption()])}
      >
        <Plus className="mr-1.5 size-4" />
        Adicionar opção
      </Button>
    </div>
  );
}
