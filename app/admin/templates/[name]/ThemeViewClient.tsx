"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Smartphone, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import InvitationPage from "@/components/shared/InvitationPage";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fontName(fontStack: string): string {
  return fontStack.replace(/['"]/g, "").split(",")[0].trim();
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-5 flex-shrink-0 rounded-full border border-black/10 shadow-sm"
        style={{ background: color }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <code className="ml-auto font-mono text-[10px] text-muted-foreground">
        {color.startsWith("rgba") ? color.slice(0, 22) + "…" : color}
      </code>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phone frame wrapper
// ---------------------------------------------------------------------------

function PhoneFrame({
  theme,
  invitation,
}: {
  theme: TemplateTheme;
  invitation: InvitationData;
}) {
  return (
    /* Outer device shell */
    <div
      className="relative mx-auto flex-shrink-0 overflow-hidden rounded-[3rem] shadow-2xl"
      style={{
        width: 375,
        height: 750,
        background: "#1a1a1a",
        border: "10px solid #1a1a1a",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Dynamic island notch */}
      <div
        className="absolute top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black"
        style={{ width: 110, height: 28 }}
      />

      {/* Scrollable invitation content */}
      <div
        className="relative h-full w-full overflow-y-auto overflow-x-hidden"
        style={{
          // hide scrollbar but keep scroll functionality
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        <InvitationPage invitation={invitation} theme={theme} />
      </div>

      {/* Bottom home-indicator bar */}
      <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
        <div
          className="rounded-full bg-white/40"
          style={{ width: 120, height: 4 }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

interface ThemeViewClientProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

export default function ThemeViewClient({
  invitation,
  theme,
}: ThemeViewClientProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Tem a certeza que quer eliminar o modelo "${theme.label}"? Esta acção não pode ser desfeita.`,
      )
    )
      return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/themes/${theme.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao eliminar");
      }
      toast.success(`Modelo "${theme.label}" eliminado.`);
      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao eliminar modelo",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-0">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/templates"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-muted-foreground",
            )}
          >
            <ArrowLeft className="size-4" />
            Modelos
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-semibold">{theme.label}</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {theme.description}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/templates/${theme.name}/edit`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            <Pencil className="size-3.5" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10",
            )}
          >
            <Trash2 className="size-3.5" />
            {deleting ? "A eliminar..." : "Eliminar"}
          </button>
          <Link
            href={`/admin/invitations/new?template=${theme.name}`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-2",
            )}
          >
            <Sparkles className="size-3.5" />
            Usar este Modelo
          </Link>
        </div>
      </div>

      {/* ── Main two-column layout ────────────────────────────────────── */}
      <div className="flex flex-1 gap-8 overflow-hidden">
        {/* ── Left panel: theme metadata ───────────────────────── */}
        <div className="flex w-72 flex-shrink-0 flex-col gap-6 overflow-y-auto pb-6">
          {/* Colour palette */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Paleta de Cores
            </h2>
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <Swatch color={theme.bg} label="Fundo" />
              <Swatch color={theme.primary} label="Primária" />
              <Swatch color={theme.secondary} label="Secundária" />
              <Swatch color={theme.accent} label="Destaque" />
              <Swatch color={theme.textPrimary} label="Texto principal" />
              <Swatch color={theme.textSecondary} label="Texto secundário" />
            </div>
          </section>

          {/* Typography */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Tipografia
            </h2>
            <div className="space-y-3 rounded-xl border bg-card p-4">
              {/* Display font */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Títulos
                </p>
                <p
                  className="text-2xl leading-tight"
                  style={{ fontFamily: theme.displayFont }}
                >
                  Sofia &amp; Miguel
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {fontName(theme.displayFont)}
                </p>
              </div>

              <div className="h-px bg-border" />

              {/* Body font */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Corpo
                </p>
                <p
                  className="text-sm leading-relaxed text-muted-foreground"
                  style={{ fontFamily: theme.bodyFont }}
                >
                  Dois corações, uma história.
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {fontName(theme.bodyFont)}
                </p>
              </div>

              {/* Script font if available */}
              {theme.scriptFont && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Script
                    </p>
                    <p
                      className="text-xl leading-tight"
                      style={{ fontFamily: theme.scriptFont }}
                    >
                      Save the Date
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {fontName(theme.scriptFont)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Button style */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Estilo de Botões
            </h2>
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <button
                className="w-full py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  background: theme.ctaPrimaryBg,
                  color: theme.ctaPrimaryText,
                  borderRadius: theme.ctaRadius === "0px" ? 4 : 9999,
                  fontFamily: theme.uiFont,
                  letterSpacing: 0.5,
                  border: "none",
                  cursor: "default",
                }}
              >
                Confirmar Presença
              </button>
              <button
                className="w-full py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  background: "transparent",
                  color: theme.ctaSecondaryText,
                  border: `1.5px solid ${theme.ctaSecondaryBorder}`,
                  borderRadius: theme.ctaRadius === "0px" ? 4 : 9999,
                  fontFamily: theme.uiFont,
                  letterSpacing: 0.5,
                  cursor: "default",
                }}
              >
                Ver Localização
              </button>
              <p className="text-[10px] text-muted-foreground">
                Raio:{" "}
                {theme.ctaRadius === "0px"
                  ? "Cantos retos"
                  : "Pílula (arredondado)"}
              </p>
            </div>
          </section>

          {/* Envelope preview */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Envelope
            </h2>
            <div className="flex items-center justify-center rounded-xl border bg-card p-6">
              <div
                className="flex h-20 w-32 items-center justify-center rounded-md shadow-sm"
                style={{ background: theme.envelope.base }}
              >
                <span
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: 22,
                    color: theme.monogramColor,
                    letterSpacing: 2,
                  }}
                >
                  S&amp;M
                </span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <Link
            href={`/admin/invitations/new?template=${theme.name}`}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full gap-2",
            )}
          >
            <Sparkles className="size-4" />
            Usar este Modelo
          </Link>
        </div>

        {/* ── Right panel: phone frame preview ─────────────────── */}
        <div className="flex flex-1 items-start justify-center overflow-y-auto pb-6 pt-2">
          <div className="flex flex-col items-center gap-4">
            {/* Label */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="size-3.5" />
              <span>Prévia — dados de exemplo</span>
            </div>

            <PhoneFrame theme={theme} invitation={invitation} />
          </div>
        </div>
      </div>
    </div>
  );
}
