"use client";

import {
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CustomFontUploadDialog from "@/components/admin/CustomFontUploadDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDynamicFont } from "@/hooks/useDynamicFont";
import {
  extractCustomFontFamilyId,
  findSelectedFontCatalogEntry,
  filterFontCatalog,
  mergeFontCatalog,
} from "@/lib/custom-fonts/domain";
import type {
  AdminCustomFontFamily,
  FontCatalogEntry,
  FontCategory as CatalogCategory,
} from "@/lib/custom-fonts/types";
import type { FontCategory, GoogleFontEntry } from "@/lib/google-fonts";
import { buildFontStack, extractFamilyName } from "@/lib/google-fonts";
import { isInlineEditorFloatingLayerTarget } from "@/lib/inline-editor-floating-layers";

interface FontPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}

type SourceFilter = "all" | "custom" | "google";

const CATEGORIES: Array<{
  label: string;
  value: FontCategory | "all";
}> = [
  { label: "Todos", value: "all" },
  { label: "Serif", value: "serif" },
  { label: "Sans-serif", value: "sans-serif" },
  { label: "Display", value: "display" },
  { label: "Manuscrita", value: "handwriting" },
  { label: "Mono", value: "monospace" },
];

const SOURCES: Array<{ label: string; value: SourceFilter }> = [
  { label: "Todas", value: "all" },
  { label: "Personalizadas", value: "custom" },
  { label: "Google", value: "google" },
];

function adminFamilyToCatalog(family: AdminCustomFontFamily): FontCatalogEntry {
  return {
    source: "custom",
    id: family.id,
    family: family.family,
    category: family.category,
    value: family.value,
    archived: family.archived,
    variants: family.variants.map((variant) => ({
      weight: variant.weight,
      style: variant.style,
    })),
  };
}

function googleToCatalog(font: GoogleFontEntry): FontCatalogEntry {
  return {
    source: font.builtin ? "builtin" : "google",
    family: font.family,
    category: font.category,
    value: buildFontStack(font.family, font.category),
    builtin: font.builtin,
  };
}

function FontRow({
  font,
  selected,
  onSelect,
}: {
  font: FontCatalogEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(false);
  useDynamicFont(preview ? font.value : null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPreview(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px" },
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const sample =
    font.category === "handwriting"
      ? "Save the Date"
      : font.category === "monospace"
        ? "31.12.2027"
        : "Sofia & Miguel";

  return (
    <div ref={rowRef}>
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-h-16 w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/55 active:bg-accent/75 ${selected ? "bg-accent/70" : ""}`}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[11px] text-muted-foreground">
              {font.family}
            </span>
            {font.source === "builtin" && (
              <Badge variant="secondary" className="h-4 gap-0.5 px-1 text-[9px] font-normal">
                <Star className="size-2.5" /> Otimizada
              </Badge>
            )}
            {font.source === "custom" && font.archived && (
              <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal">
                Arquivada
              </Badge>
            )}
          </div>
          <div className="truncate text-[17px] leading-snug" style={{ fontFamily: font.value }}>
            {sample}
          </div>
          {font.source === "custom" && (
            <div className="mt-1 flex flex-wrap gap-1">
              {font.variants.map((variant) => (
                <span
                  key={`${variant.weight}-${variant.style}`}
                  className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] tabular-nums text-muted-foreground"
                >
                  {variant.weight}{variant.style === "italic" ? " itálico" : ""}
                </span>
              ))}
            </div>
          )}
        </div>
        {selected && <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />}
      </button>
    </div>
  );
}

export default function FontPicker({
  label,
  value,
  onChange,
  optional,
}: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const [customFonts, setCustomFonts] = useState<FontCatalogEntry[]>([]);
  const [googleFonts, setGoogleFonts] = useState<FontCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCustomId = value ? extractCustomFontFamilyId(value) : null;
  const selectedFamily = value ? extractFamilyName(value) : "";

  const loadCustomFonts = useCallback(async () => {
    const response = await fetch("/api/admin/custom-fonts?limit=100");
    if (!response.ok) throw new Error("Não foi possível carregar as fontes personalizadas.");
    const body = (await response.json()) as { families: AdminCustomFontFamily[] };
    const active = body.families.map(adminFamilyToCatalog);
    if (selectedCustomId && !active.some((font) => font.source === "custom" && font.id === selectedCustomId)) {
      const selectedResponse = await fetch(`/api/admin/custom-fonts/${selectedCustomId}`);
      if (selectedResponse.ok) {
        active.push(adminFamilyToCatalog((await selectedResponse.json()) as AdminCustomFontFamily));
      }
    }
    setCustomFonts(active);
  }, [selectedCustomId]);

  const loadGoogleFonts = useCallback(
    async (nextPage: number, append: boolean) => {
      const params = new URLSearchParams({ page: String(nextPage), limit: "60" });
      if (search.trim()) params.set("search", search.trim());
      if (category !== "all") params.set("category", category);
      const response = await fetch(`/api/admin/fonts?${params}`);
      if (!response.ok) throw new Error("Não foi possível carregar as Google Fonts.");
      const body = (await response.json()) as {
        fonts: GoogleFontEntry[];
        totalPages: number;
      };
      const entries = body.fonts.map(googleToCatalog);
      setGoogleFonts((current) => (append ? [...current, ...entries] : entries));
      setTotalPages(body.totalPages);
      setPage(nextPage);
    },
    [category, search],
  );

  useEffect(() => {
    if (!open) return;
    Promise.resolve()
      .then(() => {
        setLoadError(null);
        setLoading(true);
        return loadCustomFonts();
      })
      .catch((error) =>
        setLoadError(error instanceof Error ? error.message : "Erro ao carregar fontes."),
      )
      .finally(() => setLoading(false));
  }, [loadCustomFonts, open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const close = (event: MouseEvent) => {
      if (
        !containerRef.current?.contains(event.target as Node) &&
        !isInlineEditorFloatingLayerTarget(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!open || source === "custom") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      loadGoogleFonts(1, false)
        .catch((error) =>
          setLoadError(error instanceof Error ? error.message : "Erro ao carregar fontes."),
        )
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [category, loadGoogleFonts, open, search, source]);

  useEffect(() => {
    if (!open || source === "custom") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading && page < totalPages) {
        setLoading(true);
        loadGoogleFonts(page + 1, true).finally(() => setLoading(false));
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadGoogleFonts, loading, open, page, source, totalPages]);

  const selectedEntry = useMemo(
    () => findSelectedFontCatalogEntry([...customFonts, ...googleFonts], value),
    [customFonts, googleFonts, value],
  );
  const catalog = useMemo(
    () =>
      filterFontCatalog(
        mergeFontCatalog({
          custom: customFonts.filter((font) => font.source === "custom" && !font.archived),
          google: googleFonts,
          selected: selectedEntry,
        }),
        {
          source,
          category: category as CatalogCategory | "all",
          search,
        },
      ),
    [category, customFonts, googleFonts, search, selectedEntry, source],
  );
  const displayName = selectedEntry?.family || selectedFamily || "Selecionar fonte…";

  return (
    <>
      <div className="relative space-y-1.5" ref={containerRef}>
        <Label className="text-xs">
          {label}
          {optional && <span className="ml-1 text-muted-foreground">(opcional)</span>}
        </Label>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-[background-color,box-shadow,transform] hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
        >
          <span
            className={selectedFamily ? "truncate text-[15px]" : "truncate text-sm text-muted-foreground"}
            style={selectedFamily ? { fontFamily: value } : undefined}
          >
            {displayName}
          </span>
          <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div
            data-font-picker-dropdown
            className="absolute left-0 z-50 mt-1 w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-xl bg-popover shadow-xl ring-1 ring-foreground/10"
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar fontes…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1 border-t border-foreground/5 px-3 py-2">
              {SOURCES.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setSource(item.value)}
                  className={`min-h-8 rounded-lg px-3 text-xs font-medium transition-colors ${source === item.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 overflow-x-auto border-y border-foreground/5 px-3 py-2">
              {CATEGORIES.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setCategory(item.value)}
                  className={`min-h-7 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium transition-colors ${category === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-foreground/5 px-3 py-2">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {loading ? "A carregar…" : `${catalog.length} fontes visíveis`}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 active:scale-[0.96] transition-transform"
                onClick={() => {
                  setOpen(false);
                  setUploadOpen(true);
                }}
              >
                <Plus /> Adicionar fonte
              </Button>
            </div>
            <ScrollArea className="h-[360px]">
              {optional && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center px-3 text-xs italic text-muted-foreground hover:bg-accent/50"
                >
                  Nenhuma (desativada)
                </button>
              )}
              {loadError && (
                <div className="mx-3 my-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {loadError}
                </div>
              )}
              {!loading && !loadError && catalog.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Nenhuma fonte corresponde a esta pesquisa.
                </div>
              )}
              {catalog.map((font) => (
                <FontRow
                  key={font.source === "custom" ? font.id : `${font.source}-${font.family}`}
                  font={font}
                  selected={
                    font.source === "custom"
                      ? font.id === selectedCustomId
                      : font.value === value
                  }
                  onSelect={() => {
                    onChange(font.value);
                    setOpen(false);
                  }}
                />
              ))}
              <div ref={sentinelRef} className="flex h-8 items-center justify-center">
                {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
      <CustomFontUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSaved={(family) => {
          const entry = adminFamilyToCatalog(family);
          setCustomFonts((current) => [
            entry,
            ...current.filter(
              (font) => font.source !== "custom" || font.id !== family.id,
            ),
          ]);
          onChange(family.value);
        }}
      />
    </>
  );
}
