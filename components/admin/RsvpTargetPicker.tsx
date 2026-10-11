"use client";

import { useEffect, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import type { RsvpTargetKind, RsvpTargetOption } from "@/lib/admin-list/rsvps";

const SEARCH_DEBOUNCE_MS = 250;

const optionLabel = (option: RsvpTargetOption) =>
  `${[option.bride, option.groom].filter(Boolean).join(" & ") || option.slug} (${option.count})`;

interface RsvpTargetPickerProps {
  kind: RsvpTargetKind;
  selected: RsvpTargetOption | null;
  onSelect: (slug: string) => void;
  placeholder: string;
  disabled?: boolean;
}

/**
 * Picks whose confirmations to show. Options are searched on the server, so
 * the page never has to load every invitation just to fill a dropdown.
 */
export function RsvpTargetPicker({
  kind,
  selected,
  onSelect,
  placeholder,
  disabled,
}: RsvpTargetPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<RsvpTargetOption[]>(
    selected ? [selected] : [],
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const search = query.trim();
    // Opening shows the newest at once; typing waits for a short pause.
    const timer = setTimeout(
      async () => {
        setStatus("loading");
        try {
          const res = await fetch(
            `/api/admin/rsvp-targets?${new URLSearchParams({ kind, q: search })}`,
            { signal: controller.signal },
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = (await res.json()) as { items: RsvpTargetOption[] };
          setOptions(body.items);
          setStatus("idle");
        } catch {
          if (!controller.signal.aborted) setStatus("error");
        }
      },
      search ? SEARCH_DEBOUNCE_MS : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, kind, query]);

  return (
    <Combobox<RsvpTargetOption>
      items={options}
      // The server already filtered; do not filter again in the browser.
      filter={null}
      value={selected}
      onValueChange={(next) => {
        if (next && next.slug !== selected?.slug) onSelect(next.slug);
      }}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
      inputValue={query}
      onInputValueChange={(value) => setQuery(value)}
      itemToStringLabel={optionLabel}
      isItemEqualToValue={(item, value) => item.slug === value.slug}
      disabled={disabled}
    >
      <ComboboxTrigger className="w-full">
        <span className="truncate">
          <ComboboxValue>
            {(value: RsvpTargetOption | null) =>
              value ? optionLabel(value) : placeholder
            }
          </ComboboxValue>
        </span>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Pesquisar por casal ou slug..." />
        <ComboboxStatus>
          {status === "error"
            ? "Não foi possível carregar"
            : status === "loading" && options.length === 0
              ? "A carregar..."
              : null}
        </ComboboxStatus>
        <ComboboxEmpty>
          {status === "idle" ? "Nenhum resultado" : null}
        </ComboboxEmpty>
        <ComboboxList>
          {(option: RsvpTargetOption) => (
            <ComboboxItem key={option.slug} value={option}>
              {optionLabel(option)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
