"use client";

import type { HeroScrollIndicatorConfig } from "@/lib/types";
import {
  DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y,
  DEFAULT_HERO_SCROLL_INDICATOR_SIZE,
  HERO_SCROLL_INDICATOR_OFFSET_Y_MAX,
  HERO_SCROLL_INDICATOR_OFFSET_Y_MIN,
  HERO_SCROLL_INDICATOR_SIZE_MAX,
  HERO_SCROLL_INDICATOR_SIZE_MIN,
} from "@/lib/hero-scroll-indicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

function colorPickerValue(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

interface HeroScrollIndicatorFieldsProps {
  value: HeroScrollIndicatorConfig | undefined;
  onChange: (next: HeroScrollIndicatorConfig) => void;
  /** Theme text color used as the color-picker fallback/placeholder. */
  themeTextPrimary?: string;
  /** Toggle state when `value.enabled` is unset. Default false. */
  defaultEnabled?: boolean;
  /** Slider default shown when `value.size` is unset. Default 24. */
  defaultSize?: number;
  /** Unique id prefix so multiple instances on one page don't collide. */
  idPrefix?: string;
  label?: string;
  description?: string;
}

/**
 * Admin form controls for the hero scroll-down indicator: enable toggle plus
 * color / size / vertical-position when enabled. Shared by the standard and
 * external invitation forms. `defaultEnabled` / `defaultSize` let layouts that
 * show the indicator by default (video-entrance, curtain-canva) seed sensible
 * values without changing the stored config until the user edits it.
 */
export default function HeroScrollIndicatorFields({
  value,
  onChange,
  themeTextPrimary,
  defaultEnabled = false,
  defaultSize = DEFAULT_HERO_SCROLL_INDICATOR_SIZE,
  idPrefix = "heroScrollIndicator",
  label = "Seta animada para próxima secção",
  description = "Mostra uma seta animada no fundo do hero (acima do leitor de música) que rola para a secção seguinte ao ser clicada.",
}: HeroScrollIndicatorFieldsProps) {
  const enabled = value?.enabled ?? defaultEnabled;
  const size = value?.size ?? defaultSize;
  const offsetY = value?.offsetY ?? DEFAULT_HERO_SCROLL_INDICATOR_OFFSET_Y;
  const fallbackColor = themeTextPrimary || "#000000";

  const patch = (next: Partial<HeroScrollIndicatorConfig>) =>
    onChange({ enabled, ...value, ...next });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor={`${idPrefix}Enabled`}>{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={`${idPrefix}Enabled`}
          checked={enabled}
          onCheckedChange={(checked) => patch({ enabled: checked })}
        />
      </div>

      {enabled && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cor da seta</Label>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar a cor principal do tema.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorPickerValue(value?.color, fallbackColor)}
                onChange={(e) => patch({ color: e.target.value })}
                className="h-9 w-9 rounded border cursor-pointer shrink-0"
                title="Escolher cor"
              />
              <input
                type="text"
                value={value?.color ?? ""}
                onChange={(e) => patch({ color: e.target.value })}
                placeholder={`Padrão: ${themeTextPrimary || ""}`}
                className="font-mono text-sm h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring"
              />
              {value?.color && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => patch({ color: undefined })}
                >
                  Repor
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}Size`}>Tamanho da seta</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {size}px
              </span>
            </div>
            <input
              id={`${idPrefix}Size`}
              type="range"
              min={HERO_SCROLL_INDICATOR_SIZE_MIN}
              max={HERO_SCROLL_INDICATOR_SIZE_MAX}
              step={2}
              value={size}
              onChange={(e) => patch({ size: parseInt(e.target.value, 10) })}
              className="w-full accent-foreground cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}OffsetY`}>Posição vertical</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {offsetY}px
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valores mais altos sobem a seta; mais baixos descem-na.
            </p>
            <input
              id={`${idPrefix}OffsetY`}
              type="range"
              min={HERO_SCROLL_INDICATOR_OFFSET_Y_MIN}
              max={HERO_SCROLL_INDICATOR_OFFSET_Y_MAX}
              step={4}
              value={offsetY}
              onChange={(e) => patch({ offsetY: parseInt(e.target.value, 10) })}
              className="w-full accent-foreground cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
