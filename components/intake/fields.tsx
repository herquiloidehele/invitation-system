"use client";

import { useId, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Input primitives for the customer intake wizard. Mobile first: 48px touch
// targets, 16px text (no iOS zoom), labels above, hints and errors below.
// ---------------------------------------------------------------------------

const controlClass =
  "w-full rounded-xl border border-border bg-white px-4 text-base text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-faint-foreground focus:border-primary focus:ring-3 focus:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-destructive/15 disabled:opacity-60";

export function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  optionalLabel,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  optionalLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between gap-3 text-sm font-medium text-foreground"
      >
        <span>{label}</span>
        {optionalLabel ? (
          <span className="text-xs font-normal text-subtle-foreground">
            {optionalLabel}
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type TextFieldProps = {
  label: ReactNode;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  error?: string;
  optionalLabel?: string;
  maxLength?: number;
  type?: "text" | "date" | "time" | "url" | "tel";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  name?: string;
};

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  optionalLabel,
  type = "text",
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      optionalLabel={optionalLabel}
    >
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(
          controlClass,
          "h-12",
          (type === "date" || type === "time") && "appearance-none",
        )}
        {...inputProps}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  error,
  optionalLabel,
  placeholder,
  maxLength,
  rows = 3,
}: {
  label: ReactNode;
  value: string | undefined;
  onChange: (value: string) => void;
  hint?: ReactNode;
  error?: string;
  optionalLabel?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}) {
  const id = useId();
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      optionalLabel={optionalLabel}
    >
      <textarea
        id={id}
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(controlClass, "min-h-24 resize-y py-3 leading-relaxed")}
      />
    </FieldShell>
  );
}

/** A full-width tappable row with a switch — easier to hit than a bare switch. */
export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const labelId = useId();
  const hintId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={hint ? hintId : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3 text-left transition-colors hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25 disabled:opacity-60"
    >
      <span className="space-y-0.5">
        <span id={labelId} className="block text-[15px] font-medium text-foreground">
          {label}
        </span>
        {hint ? (
          <span id={hintId} className="block text-[13px] leading-snug text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted-strong",
        )}
      >
        <span
          className={cn(
            "size-6 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label?: ReactNode;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5" role="radiogroup" aria-labelledby={label ? id : undefined}>
      {label ? (
        <p id={id} className="text-sm font-medium text-foreground">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-foreground hover:bg-surface-warm",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Up to `max` native color pickers shown as round swatches. */
export function SwatchPicker({
  label,
  colors,
  onChange,
  max,
  addLabel,
  removeLabel,
  optionalLabel,
}: {
  label: ReactNode;
  colors: string[];
  onChange: (colors: string[]) => void;
  max: number;
  addLabel: string;
  removeLabel: string;
  optionalLabel?: string;
}) {
  return (
    <FieldShell label={label} optionalLabel={optionalLabel}>
      <div className="flex flex-wrap items-center gap-3">
        {colors.map((color, index) => (
          <div key={index} className="relative">
            <label
              className="block size-11 cursor-pointer rounded-full border border-black/10 shadow-inner"
              style={{ background: color }}
            >
              <span className="sr-only">{`${color}`}</span>
              <input
                type="color"
                value={color}
                onChange={(event) =>
                  onChange(
                    colors.map((item, current) =>
                      current === index ? event.target.value : item,
                    ),
                  )
                }
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                onChange(colors.filter((_, current) => current !== index))
              }
              className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm"
            >
              <X className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{removeLabel}</span>
            </button>
          </div>
        ))}
        {colors.length < max ? (
          <button
            type="button"
            onClick={() => onChange([...colors, "#c8a27a"])}
            className="flex size-11 items-center justify-center rounded-full border border-dashed border-border bg-white text-muted-foreground transition-colors hover:bg-surface-warm"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="sr-only">{addLabel}</span>
          </button>
        ) : null}
      </div>
    </FieldShell>
  );
}

export function AddRowButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-warm disabled:opacity-50"
    >
      <Plus className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

/** Card wrapping one repeatable item, with move and remove controls. */
export function RowCard({
  title,
  children,
  onRemove,
  move,
  labels,
}: {
  title?: ReactNode;
  children: ReactNode;
  onRemove?: () => void;
  /** Shows up/down buttons; a missing direction renders disabled. */
  move?: { up?: () => void; down?: () => void };
  labels: { remove: string; moveUp: string; moveDown: string };
}) {
  const iconButton =
    "flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-warm hover:text-foreground disabled:opacity-30";
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="-mr-2 flex items-center">
          {move ? (
            <>
              <button
                type="button"
                className={iconButton}
                onClick={move.up}
                disabled={!move.up}
              >
                <ArrowUp className="size-4" aria-hidden="true" />
                <span className="sr-only">{labels.moveUp}</span>
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={move.down}
                disabled={!move.down}
              >
                <ArrowDown className="size-4" aria-hidden="true" />
                <span className="sr-only">{labels.moveDown}</span>
              </button>
            </>
          ) : null}
          {onRemove ? (
            <button type="button" className={iconButton} onClick={onRemove}>
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="sr-only">{labels.remove}</span>
            </button>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SuggestionChips({
  label,
  suggestions,
  onPick,
}: {
  label: string;
  suggestions: string[];
  onPick: (value: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-warm px-3.5 text-sm text-foreground shadow-[inset_0_0_0_1px_var(--brindel-border-light)] transition-colors hover:bg-primary-soft"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Move an item one place up or down; out-of-range moves return a copy. */
export function moveItem<T>(items: readonly T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
