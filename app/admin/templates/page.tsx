import Link from "next/link";
import { getModels } from "@/lib/models";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Eye, Sparkles, Pencil, Trash2, Plus, Copy } from "lucide-react";
import type { ModelRecord, InvitationStyles } from "@/lib/types";
import { getDefaultStylesForComponent } from "@/components/models";
import DeleteThemeButton from "./DeleteThemeButton";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Colour swatch chip
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Font name helper — strip CSS font-stack, keep the first name only
// ---------------------------------------------------------------------------

function fontName(fontStack: string): string {
  return fontStack.replace(/['"]/g, "").split(",")[0].trim();
}

// ---------------------------------------------------------------------------
// Single theme card
// ---------------------------------------------------------------------------

function ThemeCard({ model }: { model: ModelRecord }) {
  const s = getDefaultStylesForComponent(model.component);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* ── Colour band (envelope preview strip) ─────────────────────── */}
      <div
        className="relative h-28 w-full overflow-hidden"
        style={{ background: s.bg }}
      >
        {/* Subtle radial gradient wash */}
        {s.bgGradient && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: s.bgGradient }}
          />
        )}

        {/* Monogram-style preview */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span
            className="select-none"
            style={{
              fontFamily: s.displayFont,
              fontSize: 36,
              color: s.textPrimary,
              opacity: 0.85,
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            S&amp;M
          </span>
          <span
            style={{
              fontFamily: s.uiFont,
              fontSize: 9,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: s.textSecondary,
              opacity: 0.65,
            }}
          >
            20 · Setembro · 2025
          </span>
        </div>

        {/* Accent bottom bar */}
        <div
          className="absolute bottom-0 inset-x-0 h-0.5"
          style={{ background: s.accent, opacity: 0.45 }}
        />
      </div>

      {/* ── Card body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Title */}
        <div>
          <h3 className="font-semibold text-sm leading-tight">{model.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {model.description}
          </p>
        </div>

        {/* Palette swatches */}
        <div className="flex items-end gap-3">
          <Swatch color={s.primary} label="Primária" />
          <Swatch color={s.secondary} label="Secundária" />
          <Swatch color={s.accent} label="Destaque" />
          <Swatch color={s.bg} label="Fundo" />
          <Swatch
            color={s.cardBg.startsWith("rgba") ? s.accent : s.cardBg}
            label="Cartão"
          />
        </div>

        {/* Typography */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Título:</span>{" "}
            <span style={{ fontFamily: s.displayFont }}>
              {fontName(s.displayFont)}
            </span>
          </p>
          <p>
            <span className="font-medium text-foreground">Corpo:</span>{" "}
            <span style={{ fontFamily: s.bodyFont }}>
              {fontName(s.bodyFont)}
            </span>
          </p>
          <p>
            <span className="font-medium text-foreground">Botões:</span>{" "}
            <span
              className="inline-block px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: s.ctaPrimaryBg,
                color: s.ctaPrimaryText,
                borderRadius: s.ctaRadius === "0px" ? 2 : 9999,
                fontFamily: s.uiFont,
              }}
            >
              Confirmar
            </span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-auto flex gap-2 pt-2 flex-wrap">
          <Link
            href={`/admin/templates/${model.name}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex-1 gap-1.5",
            )}
          >
            <Eye className="size-3.5" />
            Ver
          </Link>
          <Link
            href={`/admin/templates/${model.name}/edit`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex-1 gap-1.5",
            )}
          >
            <Pencil className="size-3.5" />
            Editar
          </Link>
          <Link
            href={`/admin/templates/new?from=${model.name}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex-1 gap-1.5",
            )}
          >
            <Copy className="size-3.5" />
            Duplicar
          </Link>
        </div>

        {/* Delete (separate row so it's visually distinct) */}
        <div className="pt-0">
          <DeleteThemeButton modelId={model.id} themeName={model.label} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TemplatesPage() {
  const models = await getModels();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modelos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {models.length} modelo{models.length !== 1 ? "s" : ""} disponível
            {models.length !== 1 ? "is" : ""}.
          </p>
        </div>
        <Link
          href="/admin/templates/new"
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          <Plus className="size-4" />
          Novo Modelo
        </Link>
      </div>

      {/* 2×2 grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {models.map((model) => (
          <ThemeCard key={model.name} model={model} />
        ))}
      </div>
    </div>
  );
}
