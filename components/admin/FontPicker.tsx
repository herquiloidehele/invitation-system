"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Loader2, Search, Star, X } from "lucide-react";
import type { FontCategory, GoogleFontEntry } from "@/lib/google-fonts";
import {
  buildFontStack,
  extractFamilyName,
  isBuiltinFont,
} from "@/lib/google-fonts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FontPickerProps {
  label: string;
  value: string; // CSS font-family string e.g. "'Playfair Display', serif"
  onChange: (v: string) => void;
  optional?: boolean;
}

// ---------------------------------------------------------------------------
// Category tabs
// ---------------------------------------------------------------------------

const CATEGORIES: { label: string; value: FontCategory | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Serif", value: "serif" },
  { label: "Sans-serif", value: "sans-serif" },
  { label: "Display", value: "display" },
  { label: "Manuscrita", value: "handwriting" },
  { label: "Mono", value: "monospace" },
];

// ---------------------------------------------------------------------------
// Lazy font preview loader — uses IntersectionObserver to inject the
// Google Fonts CSS only when a font row scrolls into view.
// ---------------------------------------------------------------------------

/** Shared set of fonts whose CSS has been requested in this session. */
const loadedPreviewFonts = new Set<string>();

function useLazyFontPreview(family: string, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (isBuiltinFont(family)) return; // builtins already loaded
    if (loadedPreviewFonts.has(family)) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !loadedPreviewFonts.has(family)) {
            loadedPreviewFonts.add(family);
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@400&display=swap`;
            document.head.appendChild(link);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "200px" }, // preload fonts 200px before they're visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [family, enabled]);

  return ref;
}

// ---------------------------------------------------------------------------
// Font row — single item in the dropdown list
// ---------------------------------------------------------------------------

function FontRow({
  font,
  isSelected,
  onSelect,
}: {
  font: GoogleFontEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const previewRef = useLazyFontPreview(font.family, true);

  const sampleText = useMemo(() => {
    if (font.category === "handwriting") return "Save the Date";
    if (font.category === "display") return "Sofia & Miguel";
    if (font.category === "monospace") return "31.12.2025";
    return "Sofia & Miguel";
  }, [font.category]);

  return (
    <div ref={previewRef}>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/50 ${
          isSelected ? "bg-accent/70" : ""
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground truncate">
              {font.family}
            </span>
            {font.builtin && (
              <Badge
                variant="secondary"
                className="h-4 px-1 text-[9px] font-normal gap-0.5"
              >
                <Star className="size-2.5" />
                Otimizada
              </Badge>
            )}
          </div>
          <span
            className="truncate text-[17px] leading-snug"
            style={{
              fontFamily: font.builtin
                ? `var(--font-${font.family.toLowerCase().replace(/\s+/g, "-")}), '${font.family}', ${font.category === "sans-serif" ? "sans-serif" : font.category === "handwriting" ? "cursive" : "serif"}`
                : `'${font.family}', ${font.category === "sans-serif" ? "sans-serif" : font.category === "handwriting" ? "cursive" : "serif"}`,
            }}
          >
            {sampleText}
          </span>
        </div>
        {isSelected && (
          <Check
            className="size-4 flex-shrink-0 text-primary"
            strokeWidth={2.5}
          />
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FontPicker component
// ---------------------------------------------------------------------------

export default function FontPicker({
  label,
  value,
  onChange,
  optional,
}: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const [fonts, setFonts] = useState<GoogleFontEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive the currently selected family name from the CSS value
  const selectedFamily = value ? extractFamilyName(value) : "";

  // ---- Close on outside click -------------------------------------------
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ---- Focus search input on open ---------------------------------------
  useEffect(() => {
    if (open) {
      // Small delay to let the DOM mount
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open]);

  // ---- Fetch fonts when search/category changes -------------------------
  const fetchFonts = useCallback(
    async (
      s: string,
      cat: FontCategory | "all",
      pg: number,
      append: boolean,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (s.trim()) params.set("search", s.trim());
        if (cat !== "all") params.set("category", cat);
        params.set("page", String(pg));
        params.set("limit", "60");

        const res = await fetch(`/api/admin/fonts?${params}`);
        if (!res.ok) throw new Error("Failed to fetch fonts");
        const data = await res.json();

        setFonts((prev) => (append ? [...prev, ...data.fonts] : data.fonts));
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setPage(pg);
      } catch (err) {
        console.error("FontPicker fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced search
  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFonts(search, category, 1, false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, category, open, fetchFonts]);

  // ---- Infinite scroll via IntersectionObserver on sentinel element ------
  useEffect(() => {
    if (!open) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages) {
          fetchFonts(search, category, page + 1, true);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, loading, page, totalPages, search, category, fetchFonts]);

  // ---- Build display name for the trigger button -----------------------
  const displayName = selectedFamily || "Selecionar fonte...";
  const displayFontFamily = selectedFamily ? value : undefined;

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <Label className="text-xs">
        {label}
        {optional && (
          <span className="ml-1 text-muted-foreground">(opcional)</span>
        )}
      </Label>

      {/* ── Trigger button ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span
          className="truncate"
          style={
            displayFontFamily
              ? { fontFamily: displayFontFamily, fontSize: 15 }
              : { color: "var(--muted-foreground)", fontSize: 13 }
          }
        >
          {displayName}
        </span>
        <ChevronDown
          className={`ml-2 size-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── Dropdown panel ────────────────────────────────────────── */}
      {open && (
        <div className="absolute left-0 z-50 mt-1 w-[380px] overflow-hidden rounded-lg border bg-popover shadow-xl">
          {/* Search bar */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="size-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar fontes..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto border-b px-3 py-1.5 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  category === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between px-3 py-1 border-b">
            <span className="text-[11px] text-muted-foreground">
              {total > 0
                ? `${total} fonte${total !== 1 ? "s" : ""} encontrada${total !== 1 ? "s" : ""}`
                : loading
                  ? "A carregar..."
                  : "Nenhuma fonte encontrada"}
            </span>
            {loading && (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Font list */}
          <ScrollArea className="h-[340px]">
            {/* Clear option for optional fields */}
            {optional && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-xs text-muted-foreground hover:bg-accent/50 border-b"
              >
                <span className="italic">Nenhuma (desativada)</span>
              </button>
            )}

            {fonts.map((font) => {
              const isSelected =
                selectedFamily.toLowerCase() === font.family.toLowerCase();
              return (
                <FontRow
                  key={font.family}
                  font={font}
                  isSelected={isSelected}
                  onSelect={() => {
                    onChange(buildFontStack(font.family, font.category));
                    setOpen(false);
                  }}
                />
              );
            })}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4" />

            {loading && fonts.length > 0 && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
