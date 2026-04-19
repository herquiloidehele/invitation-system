import Link from "next/link";
import { getSaveDateThemes } from "@/lib/save-the-date";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { SaveTheDateThemeData } from "@/lib/save-the-date";
import DeleteSTDThemeButton from "./DeleteSTDThemeButton";

export const dynamic = "force-dynamic";

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
        style={{ background: color }}
        title={label}
      />
      <span className="text-[9px] text-muted-foreground leading-none">
        {label}
      </span>
    </div>
  );
}

function fontName(fontStack: string): string {
  return fontStack.replace(/['"]/g, "").split(",")[0].trim();
}

function ThemeCard({ theme }: { theme: SaveTheDateThemeData }) {
  const colors = theme.heartGlitterColors;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Color band — heart color gradient preview */}
      <div
        className="relative h-28 w-full overflow-hidden"
        style={{ background: theme.bgColor }}
      >
        {/* Heart preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-16 w-16">
            <defs>
              <linearGradient id={`g-${theme.id}`} x1="0" y1="0" x2="1" y2="1">
                {colors.map((c: string, i: number) => (
                  <stop
                    key={i}
                    offset={`${(i / Math.max(colors.length - 1, 1)) * 100}%`}
                    stopColor={c}
                  />
                ))}
              </linearGradient>
            </defs>
            <path
              d="M50 88 C25 70, 0 50, 0 30 C0 12, 12 0, 27 0 C37 0, 45 6, 50 18 C55 6, 63 0, 73 0 C88 0, 100 12, 100 30 C100 50, 75 70, 50 88Z"
              fill={`url(#g-${theme.id})`}
            />
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pt-20">
          <span
            className="text-xs tracking-widest uppercase opacity-60"
            style={{ color: theme.textColor, fontFamily: theme.coupleFont }}
          >
            Save the Date
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-semibold text-sm leading-tight">{theme.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {theme.description}
          </p>
        </div>

        {/* Swatches */}
        <div className="flex items-end gap-3">
          <Swatch color={theme.heartColor} label="Coração" />
          <Swatch color={theme.bgColor} label="Fundo" />
          <Swatch color={theme.textColor} label="Texto" />
          {colors[0] && <Swatch color={colors[0]} label="Glitter 1" />}
          {colors[1] && <Swatch color={colors[1]} label="Glitter 2" />}
        </div>

        {/* Typography */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Título:</span>{" "}
            <span style={{ fontFamily: theme.titleFont }}>
              {fontName(theme.titleFont)}
            </span>
          </p>
          <p>
            <span className="font-medium text-foreground">Casal:</span>{" "}
            <span style={{ fontFamily: theme.coupleFont }}>
              {fontName(theme.coupleFont)}
            </span>
          </p>
          <p>
            <span className="font-medium text-foreground">Data:</span>{" "}
            <span style={{ fontFamily: theme.dateFont }}>
              {fontName(theme.dateFont)}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          <Link
            href={`/admin/save-the-date-themes/${theme.id}/edit`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex-1 gap-1.5"
            )}
          >
            <Pencil className="size-3.5" />
            Editar
          </Link>
        </div>

        <DeleteSTDThemeButton themeId={theme.id} themeName={theme.label} />
      </div>
    </div>
  );
}

export default async function SaveTheDateThemesPage() {
  const themes = await getSaveDateThemes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Modelos Save the Date
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {themes.length} modelo{themes.length !== 1 ? "s" : ""} disponível
            {themes.length !== 1 ? "is" : ""}.
          </p>
        </div>
        <Link
          href="/admin/save-the-date-themes/new"
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          <Plus className="size-4" />
          Novo Modelo
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} />
        ))}
      </div>
    </div>
  );
}
