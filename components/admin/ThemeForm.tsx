"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Smartphone } from "lucide-react";
import InvitationPage from "@/components/shared/InvitationPage";
import FontPicker from "@/components/admin/FontPicker";
import { MOCK_INVITATION } from "@/lib/mock-invitation";
import type { ThemeFormData } from "@/lib/theme-form-data";
import { EMPTY_FORM_DATA, formDataToTheme } from "@/lib/theme-form-data";
// ThemeFormData, themeToFormData, formDataToTheme and EMPTY_FORM_DATA live in a plain .ts file
// so that server components can import them without hitting the "use client" boundary.
export type { ThemeFormData } from "@/lib/theme-form-data";
export { EMPTY_FORM_DATA } from "@/lib/theme-form-data";

// ---------------------------------------------------------------------------
// Phone frame preview (same shell used in ThemeViewClient)
// ---------------------------------------------------------------------------

function PhonePreview({ form }: { form: ThemeFormData }) {
  const theme = useMemo(() => formDataToTheme(form), [form]);
  const invitation = useMemo(
    () => ({
      ...MOCK_INVITATION,
      themeId: "__preview__",
      template: form.name || "__preview__",
    }),
    [form.name],
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Smartphone className="size-3.5" />
        <span>Prévia em tempo real</span>
      </div>

      {/* Device shell */}
      <div
        className="relative mx-auto flex-shrink-0 overflow-hidden rounded-[3rem] shadow-2xl"
        style={{
          width: 320,
          height: 640,
          background: "#1a1a1a",
          border: "10px solid #1a1a1a",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Dynamic island */}
        <div
          className="absolute top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black"
          style={{ width: 90, height: 24 }}
        />

        {/* Scrollable invitation */}
        <div
          className="relative h-full w-full overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          <InvitationPage invitation={invitation} theme={theme} isPreview />
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
          <div
            className="rounded-full bg-white/40"
            style={{ width: 100, height: 4 }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color field — clickable swatch that opens native color picker + text input
// ---------------------------------------------------------------------------

/**
 * Extract the first #rrggbb / #rgb hex found in a CSS value string.
 * Works for plain hex, rgba(), and simple gradients.
 * Returns "" if nothing parseable is found.
 */
function extractHex(value: string): string {
  const m = value.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  if (m) return m[0];
  // Try to parse rgb()/rgba() into hex
  const rgba = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgba) {
    const r = parseInt(rgba[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgba[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgba[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "";
}

/** Convert a hex color (#rrggbb) to its r, g, b decimal components. */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/**
 * Replace the colour portion of a CSS value with a new hex colour.
 * Handles plain hex values, rgb(), and rgba() — preserving the alpha channel.
 */
function replaceColorInValue(original: string, newHex: string): string {
  // If the original contains a literal hex, swap it directly
  if (/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/.test(original)) {
    return original.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/, newHex);
  }
  // If it's an rgba()/rgb() value, replace the r,g,b components keeping alpha
  const rgbaMatch = original.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(.*)\)/);
  if (rgbaMatch) {
    const rgb = hexToRgb(newHex);
    if (rgb) {
      const tail = rgbaMatch[1]; // e.g. ",0.65" or ""
      return `rgba(${rgb.r},${rgb.g},${rgb.b}${tail})`;
    }
  }
  // Fallback: just return the new hex
  return newHex;
}

function ColorField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const hex = extractHex(value);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <div className="flex items-center gap-2">
        {/* Swatch button — always visible, opens native picker */}
        <label
          className="relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-input shadow-sm transition-opacity hover:opacity-80"
          title="Escolher cor"
          style={{
            // checkerboard background for transparency / non-hex values
            backgroundImage:
              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }}
        >
          {/* Colour fill on top of the checkerboard */}
          <span
            className="absolute inset-0"
            style={{ background: value || "transparent" }}
          />
          <input
            type="color"
            value={hex || "#ffffff"}
            onChange={(e) => {
              // If value is rgba/gradient, replace the colour while keeping structure
              if (hex && value !== hex) {
                onChange(replaceColorInValue(value, e.target.value));
              } else {
                onChange(e.target.value);
              }
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        {/* Raw text input for rgba / gradient / advanced values */}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "#ffffff"}
          className="font-mono text-xs h-8"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ThemeFormProps {
  /** Existing theme id — when editing. Omit when creating. */
  themeId?: string;
  initialData?: ThemeFormData;
  mode: "create" | "edit";
}

export default function ThemeForm({
  themeId,
  initialData,
  mode,
}: ThemeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ThemeFormData>(
    initialData ?? EMPTY_FORM_DATA,
  );

  function set<K extends keyof ThemeFormData>(key: K, value: ThemeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("O identificador (slug) é obrigatório");
      return;
    }
    if (!form.label.trim()) {
      toast.error("O nome do modelo é obrigatório");
      return;
    }

    // Build the payload expected by the API
    const payload = {
      name: form.name.trim(),
      label: form.label.trim(),
      description: form.description.trim(),
      envelope: {
        base: form.envelopeBase,
        topFlap: form.envelopeTopFlap,
        bottomFlap: form.envelopeBottomFlap,
      },
      bg: form.bg,
      cardBg: form.cardBg,
      cardBorder: form.cardBorder,
      primary: form.primary,
      secondary: form.secondary,
      accent: form.accent,
      textPrimary: form.textPrimary,
      textSecondary: form.textSecondary,
      textMuted: form.textMuted,
      displayFont: form.displayFont,
      bodyFont: form.bodyFont,
      scriptFont: form.scriptFont || null,
      uiFont: form.uiFont,
      ctaPrimaryBg: form.ctaPrimaryBg,
      ctaPrimaryText: form.ctaPrimaryText,
      ctaSecondaryBorder: form.ctaSecondaryBorder,
      ctaSecondaryText: form.ctaSecondaryText,
      ctaRadius: form.ctaRadius,
      monogramColor: form.monogramColor,
      tapTextColor: form.tapTextColor,
      bgGradient: form.bgGradient || null,
      decorativeColor: form.decorativeColor,
      ctaGlow: form.ctaGlow || null,
    };

    setSaving(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/themes"
          : `/api/admin/themes/${themeId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao guardar modelo");
      }

      const saved = await res.json();

      toast.success(
        mode === "create" ? "Modelo criado!" : "Modelo atualizado!",
      );

      if (mode === "create") {
        router.push(`/admin/templates/${saved.name}`);
      } else {
        router.push(`/admin/templates/${form.name}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao guardar modelo",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-8 items-start">
      {/* ── Left: form fields ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "create" ? "Novo Modelo" : `Editar: ${form.label}`}
          </h1>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? "A guardar..."
              : mode === "create"
                ? "Criar Modelo"
                : "Guardar Alterações"}
          </Button>
        </div>

        <Accordion
          defaultValue={[
            "identity",
            "colours",
            "typography",
            "cta",
            "envelope",
            "atmospheric",
          ]}
          className="space-y-2"
        >
          {/* ── Identity ── */}
          <AccordionItem value="identity" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Identidade
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">
                    Slug (identificador único)
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      set(
                        "name",
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    placeholder="pink-floral"
                    disabled={mode === "edit"}
                    className="font-mono text-xs"
                  />
                  {mode === "edit" && (
                    <p className="text-[11px] text-muted-foreground">
                      O slug não pode ser alterado após criação.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="label" className="text-xs">
                    Nome do Modelo
                  </Label>
                  <Input
                    id="label"
                    value={form.label}
                    onChange={(e) => set("label", e.target.value)}
                    placeholder="Rosa Floral"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={2}
                  placeholder="Elegante e romântico com tons rosados..."
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Page colours ── */}
          <AccordionItem value="colours" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Paleta de Cores
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Fundo (bg)"
                  value={form.bg}
                  onChange={(v) => set("bg", v)}
                />
                <ColorField
                  label="Fundo do Cartão (cardBg)"
                  value={form.cardBg}
                  onChange={(v) => set("cardBg", v)}
                />
              </div>
              <ColorField
                label="Borda do Cartão (cardBorder)"
                value={form.cardBorder}
                onChange={(v) => set("cardBorder", v)}
              />
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <ColorField
                  label="Cor Primária"
                  value={form.primary}
                  onChange={(v) => set("primary", v)}
                />
                <ColorField
                  label="Cor Secundária"
                  value={form.secondary}
                  onChange={(v) => set("secondary", v)}
                />
                <ColorField
                  label="Cor de Destaque"
                  value={form.accent}
                  onChange={(v) => set("accent", v)}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <ColorField
                  label="Texto Principal"
                  value={form.textPrimary}
                  onChange={(v) => set("textPrimary", v)}
                />
                <ColorField
                  label="Texto Secundário"
                  value={form.textSecondary}
                  onChange={(v) => set("textSecondary", v)}
                />
                <ColorField
                  label="Texto Discreto"
                  value={form.textMuted}
                  onChange={(v) => set("textMuted", v)}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Cor Decorativa"
                  value={form.decorativeColor}
                  onChange={(v) => set("decorativeColor", v)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Typography ── */}
          <AccordionItem value="typography" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Tipografia
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <FontPicker
                  label="Fonte de Títulos"
                  value={form.displayFont}
                  onChange={(v) => set("displayFont", v)}
                />
                <FontPicker
                  label="Fonte de Corpo"
                  value={form.bodyFont}
                  onChange={(v) => set("bodyFont", v)}
                />
                <FontPicker
                  label="Fonte Script"
                  value={form.scriptFont}
                  onChange={(v) => set("scriptFont", v)}
                  optional
                />
                <FontPicker
                  label="Fonte UI"
                  value={form.uiFont}
                  onChange={(v) => set("uiFont", v)}
                />
                <FontPicker
                  label="Fonte de Títulos de Secção"
                  value={form.sectionTitleFont}
                  onChange={(v) => set("sectionTitleFont", v)}
                  optional
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">
                    Tamanho Títulos de Secção (px)
                  </Label>
                  <Input
                    type="number"
                    min={6}
                    max={100}
                    value={form.sectionTitleFontSize}
                    onChange={(e) =>
                      set("sectionTitleFontSize", e.target.value)
                    }
                    placeholder="10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Peso Títulos de Secção</Label>
                  <select
                    value={form.sectionTitleFontWeight}
                    onChange={(e) =>
                      set("sectionTitleFontWeight", e.target.value)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Auto (400)</option>
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── CTA buttons ── */}
          <AccordionItem value="cta" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Estilo de Botões (CTA)
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Fundo Botão Primário"
                  value={form.ctaPrimaryBg}
                  onChange={(v) => set("ctaPrimaryBg", v)}
                />
                <ColorField
                  label="Texto Botão Primário"
                  value={form.ctaPrimaryText}
                  onChange={(v) => set("ctaPrimaryText", v)}
                />
                <ColorField
                  label="Borda Botão Secundário"
                  value={form.ctaSecondaryBorder}
                  onChange={(v) => set("ctaSecondaryBorder", v)}
                />
                <ColorField
                  label="Texto Botão Secundário"
                  value={form.ctaSecondaryText}
                  onChange={(v) => set("ctaSecondaryText", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Raio dos Botões (ctaRadius)</Label>
                <Input
                  value={form.ctaRadius}
                  onChange={(e) => set("ctaRadius", e.target.value)}
                  placeholder="9999px (pílula) ou 0px (reto)"
                  className="font-mono text-xs"
                />
              </div>
              <ColorField
                label="Brilho do Botão (ctaGlow — opcional)"
                value={form.ctaGlow}
                onChange={(v) => set("ctaGlow", v)}
                hint="Deixe em branco para desativar"
              />
            </AccordionContent>
          </AccordionItem>

          {/* ── Envelope ── */}
          <AccordionItem value="envelope" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Envelope
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <ColorField
                label="Cor de Fundo do Envelope"
                value={form.envelopeBase}
                onChange={(v) => set("envelopeBase", v)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">URL Imagem Aba Superior</Label>
                  <Input
                    value={form.envelopeTopFlap}
                    onChange={(e) => set("envelopeTopFlap", e.target.value)}
                    placeholder="https://..."
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">URL Imagem Aba Inferior</Label>
                  <Input
                    value={form.envelopeBottomFlap}
                    onChange={(e) => set("envelopeBottomFlap", e.target.value)}
                    placeholder="https://..."
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Cor do Monograma"
                  value={form.monogramColor}
                  onChange={(v) => set("monogramColor", v)}
                />
                <ColorField
                  label="Cor do Texto de Toque"
                  value={form.tapTextColor}
                  onChange={(v) => set("tapTextColor", v)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Atmospheric ── */}
          <AccordionItem value="atmospheric" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Atmosfera (opcional)
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Gradiente de Fundo (bgGradient)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  CSS radial-gradient ou linear-gradient. Deixe em branco para
                  desativar.
                </p>
                <Input
                  value={form.bgGradient}
                  onChange={(e) => set("bgGradient", e.target.value)}
                  placeholder="radial-gradient(ellipse at 50% 0%, rgba(255,182,193,0.3) 0%, transparent 70%)"
                  className="font-mono text-xs"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* ── Right: sticky phone preview ───────────────────────────── */}
      <div className="sticky top-6 flex-shrink-0">
        <PhonePreview form={form} />
      </div>
    </div>
  );
}
