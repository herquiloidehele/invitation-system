"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TemplateTheme } from "@/lib/types";
import EnvelopeCover from "@/components/shared/EnvelopeCover";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface STDThemeFormData {
  id?: string;
  name: string;
  label: string;
  description: string;
  heartColor: string;
  heartGlitterColors: string[];
  rsvpButtonBgColor: string;
  heartTextureUrl: string;
  bgColor: string;
  titleFont: string;
  coupleFont: string;
  dateFont: string;
  textColor: string;
  confettiColors: string[];
  envelope: {
    base: string;
    topFlap: string;
    bottomFlap: string;
  } | null;
}

interface Props {
  mode: "create" | "edit";
  initialData: STDThemeFormData;
}

// ---------------------------------------------------------------------------
// Color field
// ---------------------------------------------------------------------------

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border p-0"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-xs"
          placeholder="#D4AF37"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color array field
// ---------------------------------------------------------------------------

function ColorArrayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-2">
        {value.map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={color.startsWith("#") ? color : "#000000"}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="h-7 w-7 cursor-pointer rounded border p-0"
            />
            <Input
              value={color}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, "#D4AF37"])}
        className="gap-1"
      >
        <Plus className="size-3" />
        Adicionar cor
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STD Content Preview (no phone shell — rendered inline in the tab)
// ---------------------------------------------------------------------------

function STDContentPreview({ data }: { data: STDThemeFormData }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 px-6 py-12 min-h-[500px]"
      style={{ backgroundColor: data.bgColor }}
    >
      <span
        className="text-2xl"
        style={{ fontFamily: data.titleFont, color: data.textColor }}
      >
        Save the Date
      </span>

      <svg viewBox="0 0 100 100" className="h-28 w-28">
        <defs>
          <linearGradient
            id="preview-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            {data.heartGlitterColors.map((c, i) => (
              <stop
                key={i}
                offset={`${
                  (i / Math.max(data.heartGlitterColors.length - 1, 1)) * 100
                }%`}
                stopColor={c}
              />
            ))}
          </linearGradient>
        </defs>
        <path
          d="M50 88 C25 70, 0 50, 0 30 C0 12, 12 0, 27 0 C37 0, 45 6, 50 18 C55 6, 63 0, 73 0 C88 0, 100 12, 100 30 C100 50, 75 70, 50 88Z"
          fill="url(#preview-gradient)"
        />
      </svg>

      <span
        className="text-lg tracking-[0.15em] uppercase font-light"
        style={{ fontFamily: data.coupleFont, color: data.textColor }}
      >
        Alba & Javier
      </span>

      <span
        className="text-xl font-semibold tracking-widest"
        style={{ fontFamily: data.dateFont, color: data.textColor }}
      >
        12.09.2027
      </span>

      <span
        className="rounded-full px-5 py-2 text-xs font-semibold tracking-wider text-white uppercase"
        style={{
          background: data.rsvpButtonBgColor,
          fontFamily: data.coupleFont,
        }}
      >
        Confirmar Presença
      </span>

      {/* Confetti swatches */}
      <div className="flex gap-1.5 items-center">
        <span
          className="text-[10px] opacity-60"
          style={{ color: data.textColor }}
        >
          confetti
        </span>
        {data.confettiColors.map((c, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-full border border-white/20"
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SaveTheDateThemeForm({ mode, initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof STDThemeFormData>(
    key: K,
    value: STDThemeFormData[K]
  ) => setData((p) => ({ ...p, [key]: value }));

  const hasEnvelope = Boolean(data.envelope);

  const updateEnvelope = (
    key: "base" | "topFlap" | "bottomFlap",
    value: string
  ) => {
    setData((p) => ({
      ...p,
      envelope: {
        base: p.envelope?.base || "",
        topFlap: p.envelope?.topFlap || "",
        bottomFlap: p.envelope?.bottomFlap || "",
        [key]: value,
      },
    }));
  };

  const toggleEnvelope = (enabled: boolean) => {
    if (enabled) {
      setData((p) => ({
        ...p,
        envelope: { base: "#FFFFFF", topFlap: "/images/top.png", bottomFlap: "/images/bottom.png" },
      }));
    } else {
      setData((p) => ({ ...p, envelope: null }));
    }
  };

  // Build TemplateTheme-compatible object for envelope preview
  const envelopeTheme = useMemo(() => {
    if (!data.envelope) return null;
    return {
      envelope: {
        base: data.envelope.base,
        topFlap: data.envelope.topFlap,
        bottomFlap: data.envelope.bottomFlap,
      },
      bg: data.bgColor,
    } as TemplateTheme;
  }, [data.envelope, data.bgColor]);

  const handleSubmit = async () => {
    if (!data.name || !data.label) {
      toast.error("Nome e label são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/save-the-date-themes"
          : `/api/admin/save-the-date-themes/${data.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body = { ...data };
      delete (body as { id?: string }).id;
      if (!body.heartTextureUrl)
        delete (body as { heartTextureUrl?: string }).heartTextureUrl;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao guardar");
      }

      toast.success(
        mode === "create" ? "Modelo criado com sucesso!" : "Modelo atualizado!"
      );

      if (mode === "create") {
        router.push("/admin/save-the-date-themes");
      } else {
        router.refresh();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0">
      {/* ── Left: form fields ─────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-w-0">
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === "create" ? "Novo Modelo STD" : "Editar Modelo STD"}
            </h1>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving
                ? "A guardar..."
                : mode === "create"
                  ? "Criar"
                  : "Guardar Alterações"}
            </Button>
          </div>

          <Accordion defaultValue={[]} className="space-y-2">
            {/* ── Identidade ── */}
            <AccordionItem
              value="identity"
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="text-sm font-medium">
                Identidade
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Slug (name)</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="golden-heart"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={data.label}
                    onChange={(e) => update("label", e.target.value)}
                    placeholder="Golden Heart"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Classic gold glitter heart scratch-off"
                    rows={2}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Coração ── */}
            <AccordionItem value="heart" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Coração
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <ColorField
                  id="heartColor"
                  label="Cor do Coração"
                  value={data.heartColor}
                  onChange={(v) => update("heartColor", v)}
                />
                <ColorArrayField
                  label="Cores Glitter"
                  value={data.heartGlitterColors}
                  onChange={(v) => update("heartGlitterColors", v)}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="heartTextureUrl">
                    URL Textura (opcional)
                  </Label>
                  <Input
                    id="heartTextureUrl"
                    value={data.heartTextureUrl}
                    onChange={(e) => update("heartTextureUrl", e.target.value)}
                    placeholder="https://..."
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    URL de uma imagem de textura glitter. Se vazio, usa textura
                    gerada.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Cores ── */}
            <AccordionItem value="colors" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Cores
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <ColorField
                  id="bgColor"
                  label="Fundo da Página"
                  value={data.bgColor}
                  onChange={(v) => update("bgColor", v)}
                />
                <ColorField
                  id="textColor"
                  label="Cor do Texto"
                  value={data.textColor}
                  onChange={(v) => update("textColor", v)}
                />
                <ColorField
                  id="rsvpButtonBgColor"
                  label="Fundo do Botão RSVP"
                  value={data.rsvpButtonBgColor}
                  onChange={(v) => update("rsvpButtonBgColor", v)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ── Tipografia ── */}
            <AccordionItem
              value="typography"
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="text-sm font-medium">
                Tipografia
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="titleFont">Fonte do Título</Label>
                  <Input
                    id="titleFont"
                    value={data.titleFont}
                    onChange={(e) => update("titleFont", e.target.value)}
                    placeholder="'Great Vibes', cursive"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="coupleFont">Fonte do Casal</Label>
                  <Input
                    id="coupleFont"
                    value={data.coupleFont}
                    onChange={(e) => update("coupleFont", e.target.value)}
                    placeholder="'Cormorant Garamond', serif"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateFont">Fonte da Data</Label>
                  <Input
                    id="dateFont"
                    value={data.dateFont}
                    onChange={(e) => update("dateFont", e.target.value)}
                    placeholder="'Cormorant Garamond', serif"
                    className="font-mono text-xs"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Confetti ── */}
            <AccordionItem value="confetti" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Confetti
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <ColorArrayField
                  label="Cores do Confetti"
                  value={data.confettiColors}
                  onChange={(v) => update("confettiColors", v)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ── Envelope ── */}
            <AccordionItem value="envelope" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Envelope
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="envelopeEnabled"
                    checked={hasEnvelope}
                    onChange={(e) => toggleEnvelope(e.target.checked)}
                    className="h-4 w-4 rounded border"
                  />
                  <Label htmlFor="envelopeEnabled" className="text-xs">
                    Ativar envelope para este modelo
                  </Label>
                </div>
                {hasEnvelope && data.envelope && (
                  <>
                    <ColorField
                      id="envBase"
                      label="Cor de Fundo do Envelope"
                      value={data.envelope.base}
                      onChange={(v) => updateEnvelope("base", v)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          URL Imagem Aba Superior
                        </Label>
                        <Input
                          value={data.envelope.topFlap}
                          onChange={(e) =>
                            updateEnvelope("topFlap", e.target.value)
                          }
                          placeholder="https://..."
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          URL Imagem Aba Inferior
                        </Label>
                        <Input
                          value={data.envelope.bottomFlap}
                          onChange={(e) =>
                            updateEnvelope("bottomFlap", e.target.value)
                          }
                          placeholder="https://..."
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* ── Right: tabbed preview panel ───────────────────────────── */}
      <div className="w-[35%] min-w-[380px] border-l flex flex-col h-full">
        <Tabs defaultValue="std" className="flex flex-col h-full">
          {/* Tab bar */}
          <div className="px-4 pt-3 pb-0 border-b bg-muted/50 flex items-center justify-between gap-2 shrink-0">
            <TabsList className="h-8">
              {hasEnvelope && (
                <TabsTrigger value="envelope" className="text-xs px-3 h-7">
                  Envelope
                </TabsTrigger>
              )}
              <TabsTrigger value="std" className="text-xs px-3 h-7">
                Save the Date
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Tab: Envelope preview ── */}
          {hasEnvelope && envelopeTheme && (
            <TabsContent
              value="envelope"
              className="flex-1 overflow-hidden m-0"
            >
              <div className="h-full relative overflow-hidden bg-neutral-200 max-h-165">
                {data.envelope?.topFlap && data.envelope?.bottomFlap ? (
                  <EnvelopeCover
                    theme={envelopeTheme}
                    onOpen={() => {}}
                    shimmer
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
                    Configure as URLs das abas do envelope para ver a
                    pré-visualização
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* ── Tab: Save the Date preview ── */}
          <TabsContent
            value="std"
            className="flex-1 overflow-auto m-0 bg-neutral-100"
          >
            <STDContentPreview data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
