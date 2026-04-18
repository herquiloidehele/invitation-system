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
import { ColorField } from "@/components/admin/ColorField";
import type { ModelStyleEditorProps } from "@/components/models/types";
import type { ModernMinimalStyles } from "./types";

// ---------------------------------------------------------------------------
// ModernMinimal Style Editor
// ---------------------------------------------------------------------------

export default function ModernMinimalStyleEditor({
  styles: rawStyles,
  onStyleChange: rawOnStyleChange,
  defaultOpen = [],
}: ModelStyleEditorProps) {
  const styles = rawStyles as unknown as ModernMinimalStyles;
  const onStyleChange = rawOnStyleChange as <K extends keyof ModernMinimalStyles>(
    key: K,
    value: ModernMinimalStyles[K],
  ) => void;

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
