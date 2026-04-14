"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FontPicker from "@/components/admin/FontPicker";
import type { InvitationStyles } from "@/lib/types";

// ---------------------------------------------------------------------------
// Color field — clickable swatch that opens native color picker + text input
// ---------------------------------------------------------------------------

function extractHex(value: string): string {
  const m = value.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  if (m) return m[0];
  const rgba = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgba) {
    const r = parseInt(rgba[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgba[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgba[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function replaceColorInValue(original: string, newHex: string): string {
  if (/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/.test(original)) {
    return original.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/, newHex);
  }
  const rgbaMatch = original.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(.*)\)/);
  if (rgbaMatch) {
    const rgb = hexToRgb(newHex);
    if (rgb) {
      const tail = rgbaMatch[1];
      return `rgba(${rgb.r},${rgb.g},${rgb.b}${tail})`;
    }
  }
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
        <label
          className="relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-input shadow-sm transition-opacity hover:opacity-80"
          title="Escolher cor"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }}
        >
          <span
            className="absolute inset-0"
            style={{ background: value || "transparent" }}
          />
          <input
            type="color"
            value={hex || "#ffffff"}
            onChange={(e) => {
              if (hex && value !== hex) {
                onChange(replaceColorInValue(value, e.target.value));
              } else {
                onChange(e.target.value);
              }
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
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
// Props
// ---------------------------------------------------------------------------

interface StyleCustomizationSectionProps {
  /** Current styles to display and edit */
  styles: InvitationStyles;
  /** Callback to update a single top-level style field */
  onStyleChange: <K extends keyof InvitationStyles>(
    key: K,
    value: InvitationStyles[K],
  ) => void;
  /** Which accordion subsections to open by default */
  defaultOpen?: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Reusable visual style customization section with nested accordions.
 * Groups: Cores, Tipografia, Botoes, Capa, Decorativo.
 * Used by both InvitationForm and ExternalInvitationForm.
 */
export default function StyleCustomizationSection({
  styles,
  onStyleChange,
  defaultOpen = [],
}: StyleCustomizationSectionProps) {
  return (
    <Accordion multiple defaultValue={defaultOpen} className="space-y-1.5">
      {/* ── Cores ── */}
      <AccordionItem value="colours" className="border rounded-lg px-3">
        <AccordionTrigger className="text-xs font-medium py-2.5">
          Paleta de Cores
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Fundo (bg)"
              value={styles.bg}
              onChange={(v) => onStyleChange("bg", v)}
            />
            <ColorField
              label="Fundo do Cartão"
              value={styles.cardBg}
              onChange={(v) => onStyleChange("cardBg", v)}
            />
          </div>
          <ColorField
            label="Borda do Cartão"
            value={styles.cardBorder}
            onChange={(v) => onStyleChange("cardBorder", v)}
          />
          <Separator />
          <div className="grid grid-cols-3 gap-3">
            <ColorField
              label="Primária"
              value={styles.primary}
              onChange={(v) => onStyleChange("primary", v)}
            />
            <ColorField
              label="Secundária"
              value={styles.secondary}
              onChange={(v) => onStyleChange("secondary", v)}
            />
            <ColorField
              label="Destaque"
              value={styles.accent}
              onChange={(v) => onStyleChange("accent", v)}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-3">
            <ColorField
              label="Texto Principal"
              value={styles.textPrimary}
              onChange={(v) => onStyleChange("textPrimary", v)}
            />
            <ColorField
              label="Texto Secundário"
              value={styles.textSecondary}
              onChange={(v) => onStyleChange("textSecondary", v)}
            />
            <ColorField
              label="Texto Discreto"
              value={styles.textMuted}
              onChange={(v) => onStyleChange("textMuted", v)}
            />
          </div>
          <Separator />
          <ColorField
            label="Cor Decorativa"
            value={styles.decorativeColor}
            onChange={(v) => onStyleChange("decorativeColor", v)}
          />
        </AccordionContent>
      </AccordionItem>

      {/* ── Tipografia ── */}
      <AccordionItem value="typography" className="border rounded-lg px-3">
        <AccordionTrigger className="text-xs font-medium py-2.5">
          Tipografia
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <FontPicker
              label="Fonte de Títulos"
              value={styles.displayFont}
              onChange={(v) => onStyleChange("displayFont", v)}
            />
            <FontPicker
              label="Fonte de Corpo"
              value={styles.bodyFont}
              onChange={(v) => onStyleChange("bodyFont", v)}
            />
            <FontPicker
              label="Fonte Script"
              value={styles.scriptFont ?? ""}
              onChange={(v) => onStyleChange("scriptFont", v || undefined)}
              optional
            />
            <FontPicker
              label="Fonte UI"
              value={styles.uiFont}
              onChange={(v) => onStyleChange("uiFont", v)}
            />
            <FontPicker
              label="Fonte Títulos de Secção"
              value={styles.sectionTitleFont ?? ""}
              onChange={(v) =>
                onStyleChange("sectionTitleFont", v || undefined)
              }
              optional
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tamanho Títulos de Secção (px)</Label>
              <Input
                type="number"
                min={6}
                max={100}
                value={styles.sectionTitleFontSize ?? ""}
                onChange={(e) =>
                  onStyleChange(
                    "sectionTitleFontSize",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Peso Títulos de Secção</Label>
              <select
                value={styles.sectionTitleFontWeight ?? ""}
                onChange={(e) =>
                  onStyleChange(
                    "sectionTitleFontWeight",
                    e.target.value || undefined,
                  )
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

      {/* ── Botões (CTA) ── */}
      <AccordionItem value="cta" className="border rounded-lg px-3">
        <AccordionTrigger className="text-xs font-medium py-2.5">
          Estilo de Botões (CTA)
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Fundo Botão Primário"
              value={styles.ctaPrimaryBg}
              onChange={(v) => onStyleChange("ctaPrimaryBg", v)}
            />
            <ColorField
              label="Texto Botão Primário"
              value={styles.ctaPrimaryText}
              onChange={(v) => onStyleChange("ctaPrimaryText", v)}
            />
            <ColorField
              label="Borda Botão Secundário"
              value={styles.ctaSecondaryBorder}
              onChange={(v) => onStyleChange("ctaSecondaryBorder", v)}
            />
            <ColorField
              label="Texto Botão Secundário"
              value={styles.ctaSecondaryText}
              onChange={(v) => onStyleChange("ctaSecondaryText", v)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Raio dos Botões</Label>
            <Input
              value={styles.ctaRadius}
              onChange={(e) => onStyleChange("ctaRadius", e.target.value)}
              placeholder="9999px (pílula) ou 0px (reto)"
              className="font-mono text-xs"
            />
          </div>
          <ColorField
            label="Brilho do Botão (opcional)"
            value={styles.ctaGlow ?? ""}
            onChange={(v) => onStyleChange("ctaGlow", v || undefined)}
            hint="Deixe em branco para desativar"
          />
        </AccordionContent>
      </AccordionItem>

      {/* ── Capa (Cover) ── */}
      <AccordionItem value="cover" className="border rounded-lg px-3">
        <AccordionTrigger className="text-xs font-medium py-2.5">
          Capa & Monograma
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Cor do Monograma"
              value={styles.monogramColor}
              onChange={(v) => onStyleChange("monogramColor", v)}
            />
            <ColorField
              label="Cor do Texto de Toque"
              value={styles.tapTextColor}
              onChange={(v) => onStyleChange("tapTextColor", v)}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Decorativo / Atmosfera ── */}
      <AccordionItem value="atmospheric" className="border rounded-lg px-3">
        <AccordionTrigger className="text-xs font-medium py-2.5">
          Atmosfera (opcional)
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Gradiente de Fundo</Label>
            <p className="text-[11px] text-muted-foreground">
              CSS radial-gradient ou linear-gradient. Deixe em branco para
              desativar.
            </p>
            <Input
              value={styles.bgGradient ?? ""}
              onChange={(e) =>
                onStyleChange("bgGradient", e.target.value || undefined)
              }
              placeholder="radial-gradient(ellipse at 50% 0%, rgba(255,182,193,0.3) 0%, transparent 70%)"
              className="font-mono text-xs"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
