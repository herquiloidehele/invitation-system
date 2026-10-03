"use client";

import { RotateCcw, X } from "lucide-react";

import FontPicker from "@/components/admin/FontPicker";
import MediaUpload from "@/components/admin/MediaUpload";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  RSVP_PAGE_COLOR_KEYS,
  isRsvpPageHexColor,
  resolveRsvpPageStyle,
} from "@/lib/rsvp-page-style";
import type {
  InvitationData,
  RsvpPageBase,
  RsvpPageColorKey,
  RsvpPageLayout,
  RsvpPageRadius,
  RsvpPageShadow,
  RsvpPageStyle,
  TemplateTheme,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const COLOR_LABELS: Record<RsvpPageColorKey, string> = {
  pageBg: "Fundo da página",
  cardBg: "Fundo do cartão",
  border: "Bordas",
  title: "Título",
  text: "Texto",
  muted: "Texto secundário",
  accent: "Destaque",
  buttonBg: "Botão — fundo",
  buttonText: "Botão — texto",
};

const BASE_OPTIONS: { value: RsvpPageBase; label: string; description: string }[] = [
  {
    value: "neutral",
    label: "Neutro",
    description: "O aspeto atual: cinzento claro e branco.",
  },
  {
    value: "theme",
    label: "Tema do convite",
    description: "Cores e fontes do tema escolhido.",
  },
];

const LAYOUT_OPTIONS: {
  value: RsvpPageLayout;
  label: string;
  description: string;
}[] = [
  {
    value: "classic",
    label: "Clássico",
    description: "Cabeçalho em faixa e formulário num cartão.",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Sem cartão: o formulário assenta na página.",
  },
  {
    value: "editorial",
    label: "Editorial",
    description: "Título grande, monograma e ornamento.",
  },
];

const RADIUS_OPTIONS: { value: RsvpPageRadius | "default"; label: string }[] = [
  { value: "default", label: "Padrão" },
  { value: "square", label: "Retos" },
  { value: "soft", label: "Suaves" },
  { value: "round", label: "Arredondados" },
];

const SHADOW_OPTIONS: { value: RsvpPageShadow; label: string }[] = [
  { value: "none", label: "Nenhuma" },
  { value: "soft", label: "Suave" },
  { value: "strong", label: "Forte" },
];

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/** First family of a CSS font stack, unquoted — for hints. */
function fontLabel(stack: string): string {
  return stack.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
}

/** Drops undefined entries; returns undefined for an empty object. */
function compact<T extends object>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return entries.length > 0 ? (Object.fromEntries(entries) as T) : undefined;
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; description: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div
        className={cn(
          "grid gap-2",
          options.length === 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-lg border p-2.5 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const swatch = isRsvpPageHexColor(value)
    ? value
    : isRsvpPageHexColor(fallback)
      ? fallback
      : "#000000";
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatch}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
          aria-label={label}
        />
        <Input
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value.trim())}
          placeholder={fallback}
          className="h-8 min-w-0 font-mono text-sm"
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange("")}
            aria-label={`Limpar ${label.toLowerCase()}`}
          >
            <X size={14} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function RsvpPageStyleSection({
  accordionValue,
  value,
  onChange,
  theme,
  rsvp,
}: {
  accordionValue: string;
  value: RsvpPageStyle | undefined;
  onChange: (next: RsvpPageStyle) => void;
  theme: TemplateTheme | undefined;
  rsvp: InvitationData["rsvp"];
}) {
  // Editing a legacy (unset) invitation starts from Neutro so nothing jumps.
  const current: RsvpPageStyle = value ?? { base: "neutral" };
  const layout = current.layout ?? "classic";
  const tokens = resolveRsvpPageStyle({ config: current, theme, rsvp });
  const baseTokens = resolveRsvpPageStyle({
    config: { ...current, colors: undefined, fonts: undefined },
    theme,
    rsvp,
  });

  const patch = (next: Partial<RsvpPageStyle>) =>
    onChange({ ...current, ...next });

  const setColor = (key: RsvpPageColorKey, color: string) =>
    patch({ colors: compact({ ...current.colors, [key]: color || undefined }) });

  const setFont = (key: "title" | "body", font: string) =>
    patch({ fonts: compact({ ...current.fonts, [key]: font || undefined }) });

  const setShape = (next: NonNullable<RsvpPageStyle["shape"]>) =>
    patch({ shape: compact({ ...current.shape, ...next }) });

  const setHeader = (next: NonNullable<RsvpPageStyle["header"]>) =>
    patch({ header: compact({ ...current.header, ...next }) });

  const baseLabel =
    BASE_OPTIONS.find((option) => option.value === current.base)?.label ?? "";
  const layoutLabel =
    LAYOUT_OPTIONS.find((option) => option.value === layout)?.label ?? "";

  return (
    <AccordionItem value={accordionValue} className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-medium">
        Página de confirmação ({value ? `${baseLabel} · ${layoutLabel}` : "Neutro"})
      </AccordionTrigger>
      <AccordionContent className="space-y-5 pb-4">
        <p className="text-xs text-muted-foreground">
          Aparência da página /confirmar. Veja o resultado no separador
          &laquo;RSVP&raquo; da pré-visualização.
        </p>

        <OptionGroup
          label="Base"
          options={BASE_OPTIONS}
          value={current.base}
          onChange={(base) => patch({ base })}
        />

        <OptionGroup
          label="Layout"
          options={LAYOUT_OPTIONS}
          value={layout}
          onChange={(next) => patch({ layout: next })}
        />

        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <Label>Cores</Label>
            {current.colors ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => patch({ colors: undefined })}
              >
                <RotateCcw size={12} />
                Repor cores
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Vazio = cor da base. O estilo e as cores dos campos definem-se na
            secção RSVP.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {RSVP_PAGE_COLOR_KEYS.map((key) => (
              <ColorRow
                key={key}
                label={COLOR_LABELS[key]}
                value={current.colors?.[key]}
                fallback={baseTokens.colors[key]}
                onChange={(color) => setColor(key, color)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3">
          <Label>Tipografia</Label>
          <FontPicker
            label="Título"
            value={current.fonts?.title ?? ""}
            onChange={(font) => setFont("title", font)}
            optional
          />
          <FontPicker
            label="Texto e campos"
            value={current.fonts?.body ?? ""}
            onChange={(font) => setFont("body", font)}
            optional
          />
          <p className="text-xs text-muted-foreground">
            Vazio = fontes da base ({fontLabel(baseTokens.fonts.title)} /{" "}
            {fontLabel(baseTokens.fonts.body)}).
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3">
          <Label>Forma</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor={`${accordionValue}-radius`}
                className="text-xs text-muted-foreground"
              >
                Cantos
              </Label>
              <select
                id={`${accordionValue}-radius`}
                className={SELECT_CLASS}
                value={current.shape?.radius ?? "default"}
                onChange={(event) =>
                  setShape({
                    radius:
                      event.target.value === "default"
                        ? undefined
                        : (event.target.value as RsvpPageRadius),
                  })
                }
              >
                {RADIUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor={`${accordionValue}-shadow`}
                className="text-xs text-muted-foreground"
              >
                Sombra do cartão
              </Label>
              <select
                id={`${accordionValue}-shadow`}
                className={SELECT_CLASS}
                value={current.shape?.shadow ?? "soft"}
                onChange={(event) =>
                  setShape({ shadow: event.target.value as RsvpPageShadow })
                }
              >
                {SHADOW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <SwitchRow
            label="Borda no cartão"
            checked={tokens.cardBorder}
            onCheckedChange={(border) => setShape({ border })}
          />
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3">
          <Label>Cabeçalho</Label>
          <SwitchRow
            label="Mostrar texto de topo"
            checked={tokens.header.showEyebrow}
            onCheckedChange={(showEyebrow) => setHeader({ showEyebrow })}
          />
          <SwitchRow
            label="Mostrar data"
            checked={tokens.header.showDate}
            onCheckedChange={(showDate) => setHeader({ showDate })}
          />
          <SwitchRow
            label="Mostrar monograma"
            checked={tokens.header.showMonogram}
            onCheckedChange={(showMonogram) => setHeader({ showMonogram })}
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Imagem de topo (opcional)
            </Label>
            <MediaUpload
              kind="image"
              maxSizeMB={2}
              value={current.header?.imageUrl || undefined}
              onUpload={(imageUrl) => setHeader({ imageUrl })}
              onClear={() => setHeader({ imageUrl: undefined })}
            />
          </div>
        </div>

        {value ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onChange({ base: current.base })}
          >
            <RotateCcw size={14} />
            Repor personalização
          </Button>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
}
