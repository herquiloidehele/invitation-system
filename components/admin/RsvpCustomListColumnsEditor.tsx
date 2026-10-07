"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createRsvpOption,
  RSVP_BUILDER_SELECT_POPUP_CLASS,
  RsvpCustomOptionsEditor,
} from "@/components/admin/RsvpCustomOptionsEditor";
import { RSVP_LIST_MAX_COLUMNS } from "@/lib/rsvp-custom-fields";
import type {
  RsvpCustomListColumn,
  RsvpCustomListColumnType,
} from "@/lib/types";

const COLUMN_TYPES: { value: RsvpCustomListColumnType; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "select", label: "Lista de opções" },
];

const EXAMPLE_HINT_BY_TYPE: Record<RsvpCustomListColumnType, string> = {
  text: "Ex: Ana",
  number: "Ex: 5",
  select: "Ex: Selecione",
};

export function createRsvpListColumn(): RsvpCustomListColumn {
  return { id: `rsvp-column-${crypto.randomUUID()}`, label: "", type: "text" };
}

/** The inputs that make up one row of a list field, plus its add-button text. */
export function RsvpCustomListColumnsEditor({
  columns,
  addLabel,
  sourceColumns,
  sourceAddLabel,
  structureLocked = false,
  onColumnsChange,
  onAddLabelChange,
}: {
  columns: RsvpCustomListColumn[];
  addLabel: string | undefined;
  sourceColumns?: RsvpCustomListColumn[];
  sourceAddLabel?: string;
  structureLocked?: boolean;
  onColumnsChange: (columns: RsvpCustomListColumn[]) => void;
  onAddLabelChange: (addLabel: string) => void;
}) {
  const sourceById = new Map(
    (sourceColumns ?? []).map((column) => [column.id, column]),
  );

  const updateColumn = (id: string, patch: Partial<RsvpCustomListColumn>) => {
    onColumnsChange(
      columns.map((column) => {
        if (column.id !== id) return column;
        const next = { ...column, ...patch };
        if (next.type !== "select") {
          delete next.options;
        } else if (!next.options || next.options.length === 0) {
          next.options = [createRsvpOption()];
        }
        return next;
      }),
    );
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div>
        <Label>Colunas</Label>
        <p className="text-xs text-muted-foreground">
          Cada linha que o convidado adicionar terá estes campos lado a lado.
        </p>
      </div>

      {columns.map((column, index) => (
        <div
          key={column.id}
          className="space-y-3 rounded-md border bg-muted/20 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Coluna {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              disabled={structureLocked || columns.length === 1}
              onClick={() =>
                onColumnsChange(columns.filter((item) => item.id !== column.id))
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={column.label}
                onChange={(event) =>
                  updateColumn(column.id, { label: event.target.value })
                }
                placeholder={sourceById.get(column.id)?.label || "Ex: Idade"}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                items={COLUMN_TYPES}
                value={column.type}
                disabled={structureLocked}
                onValueChange={(value) =>
                  updateColumn(column.id, {
                    type: value as RsvpCustomListColumnType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={RSVP_BUILDER_SELECT_POPUP_CLASS}>
                  {COLUMN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {column.type === "number" && (
                <p className="text-xs text-muted-foreground">
                  Para idades e quantidades: só números inteiros. Para
                  telefones ou códigos use Texto.
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Texto de exemplo</Label>
              <Input
                value={column.placeholder ?? ""}
                onChange={(event) =>
                  updateColumn(column.id, { placeholder: event.target.value })
                }
                placeholder={
                  sourceById.get(column.id)?.placeholder ||
                  EXAMPLE_HINT_BY_TYPE[column.type]
                }
              />
            </div>
          </div>

          {column.type === "select" && (
            <RsvpCustomOptionsEditor
              options={column.options ?? []}
              sourceOptions={sourceById.get(column.id)?.options}
              structureLocked={structureLocked}
              onChange={(options) => updateColumn(column.id, { options })}
            />
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={structureLocked || columns.length >= RSVP_LIST_MAX_COLUMNS}
        onClick={() => onColumnsChange([...columns, createRsvpListColumn()])}
      >
        <Plus className="mr-1.5 size-4" />
        Adicionar coluna
      </Button>

      <div className="space-y-1.5">
        <Label>Texto do botão</Label>
        <Input
          value={addLabel ?? ""}
          onChange={(event) => onAddLabelChange(event.target.value)}
          placeholder={sourceAddLabel || "Adicionar"}
        />
        <p className="text-xs text-muted-foreground">
          O botão que o convidado usa para acrescentar uma linha.
        </p>
      </div>
    </div>
  );
}
