"use client";

import type { CSSProperties } from "react";
import { Plus, X } from "lucide-react";
import {
  RSVP_LIST_CELL_MAX_LENGTH,
  RSVP_LIST_MAX_ROWS,
} from "@/lib/rsvp-custom-fields";
import type {
  RsvpCustomField,
  RsvpCustomListColumn,
  RsvpCustomListRow,
} from "@/lib/types";

const EMPTY_ROW: RsvpCustomListRow = {};

// Written out in full so Tailwind can see every class. Three inputs do not fit
// side by side on a phone, so a three-column list reflows when its container is
// narrow: the first column takes a line of its own and the other two share the
// next one (see `reflows` below).
const GRID_BY_COLUMN_COUNT: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 @sm:grid-cols-3",
};

/**
 * A list field: rows of the admin-defined columns, side by side, that the
 * guest can add to and remove from. Purely controlled; `rows` is the form
 * state for this field.
 */
export function RSVPCustomListField({
  field,
  rows,
  onChange,
  labelStyle,
  inputClassName,
  inputStyle,
  choiceClassName,
  choiceStyle,
}: {
  field: RsvpCustomField;
  rows: RsvpCustomListRow[];
  onChange: (rows: RsvpCustomListRow[]) => void;
  labelStyle: CSSProperties;
  inputClassName: string;
  inputStyle: CSSProperties;
  choiceClassName: string;
  choiceStyle: (selected: boolean) => CSSProperties;
}) {
  const columns = field.columns ?? [];
  // There is always one row to type into; it only becomes state once edited.
  const shownRows = rows.length > 0 ? rows : [EMPTY_ROW];
  // A lone row cannot be removed, so the remove button (and the space it
  // takes) only appears once there is something to remove.
  const removable = shownRows.length > 1;
  const reflows = columns.length >= 3;
  const gridClassName = `grid min-w-0 flex-1 gap-2 ${
    GRID_BY_COLUMN_COUNT[columns.length] ?? "grid-cols-1"
  }`;
  const columnLabelStyle: CSSProperties = {
    ...labelStyle,
    fontSize: "0.7rem",
    opacity: 0.8,
  };

  const setCell = (
    rowIndex: number,
    column: RsvpCustomListColumn,
    raw: string,
  ) => {
    const value = column.type === "number" ? raw.replace(/\D/g, "") : raw;
    onChange(
      shownRows.map((row, index) =>
        index === rowIndex ? { ...row, [column.id]: value } : row,
      ),
    );
  };

  return (
    <div className="@container flex flex-col gap-2">
      {/* Column headings. A reflowed list labels each cell instead. */}
      <div
        className={`flex gap-2 ${reflows ? "@max-sm:hidden" : ""}`}
        aria-hidden="true"
      >
        <div className={gridClassName}>
          {columns.map((column) => (
            <span
              key={column.id}
              className="truncate"
              style={columnLabelStyle}
            >
              {column.label}
            </span>
          ))}
        </div>
        {removable && <span className="w-8 shrink-0" />}
      </div>

      {shownRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex items-center gap-2 ${
            reflows ? "@max-sm:items-end @max-sm:pb-1" : ""
          }`}
        >
          <div className={gridClassName}>
            {columns.map((column, columnIndex) => (
              <div
                key={column.id}
                className={`flex min-w-0 flex-col gap-1 ${
                  reflows && columnIndex === 0 ? "@max-sm:col-span-2" : ""
                }`}
              >
                {reflows && (
                  <span
                    className="truncate @sm:hidden"
                    style={columnLabelStyle}
                    aria-hidden="true"
                  >
                    {column.label}
                  </span>
                )}
                {column.type === "select" ? (
                  <select
                    aria-label={`${column.label} ${rowIndex + 1}`}
                    value={row[column.id] ?? ""}
                    onChange={(event) =>
                      setCell(rowIndex, column, event.target.value)
                    }
                    className={`${inputClassName} min-w-0`}
                    style={inputStyle}
                  >
                    <option value="">
                      {column.placeholder || "Selecione"}
                    </option>
                    {(column.options ?? []).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    aria-label={`${column.label} ${rowIndex + 1}`}
                    value={row[column.id] ?? ""}
                    onChange={(event) =>
                      setCell(rowIndex, column, event.target.value)
                    }
                    placeholder={column.placeholder || undefined}
                    inputMode={column.type === "number" ? "numeric" : undefined}
                    maxLength={
                      column.type === "number" ? 9 : RSVP_LIST_CELL_MAX_LENGTH
                    }
                    className={`${inputClassName} min-w-0`}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>
          {removable && (
            <button
              type="button"
              aria-label={`Remover linha ${rowIndex + 1}`}
              onClick={() =>
                onChange(shownRows.filter((_, index) => index !== rowIndex))
              }
              className="flex size-8 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
              style={{ color: inputStyle.color }}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ))}

      {shownRows.length < RSVP_LIST_MAX_ROWS && (
        <button
          type="button"
          onClick={() => onChange([...shownRows, {}])}
          className={choiceClassName}
          style={{ ...choiceStyle(false), fontFamily: inputStyle.fontFamily }}
        >
          <Plus className="size-4" />
          {field.addLabel || "Adicionar"}
        </button>
      )}
    </div>
  );
}
