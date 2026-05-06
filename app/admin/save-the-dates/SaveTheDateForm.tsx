"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SaveTheDateThemeData } from "@/lib/save-the-date";
import type {
  EnvelopeConfig,
  SocialPreview,
  TemplateTheme,
  TextStyle,
  TextStyleOverrides,
} from "@/lib/types";
import { getSaveTheDateEnvelopeCoverBackground } from "@/lib/save-the-date-envelope";
import { resolveSaveTheDateSocialPreview } from "@/lib/social-preview";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import MediaUpload from "@/components/admin/MediaUpload";
import SaveTheDateView from "@/components/save-the-date/SaveTheDateView";
import SocialPreviewSection from "@/components/admin/SocialPreviewSection";
import { InlineTextEditProvider } from "@/components/shared/EditableText";
import TextStyleToolbar from "@/components/admin/TextStyleToolbar";
import { OwnerLinkPanel } from "@/app/admin/invitations/OwnerLinkPanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaveTheDateFormData {
  id?: string;
  slug: string;
  themeId: string;
  couple: { bride: string; groom: string };
  date: {
    iso: string;
    display: string;
    day: string;
    month: string;
    year: string;
  };
  customMessage: string;
  envelope?: EnvelopeConfig;
  textStyles?: TextStyleOverrides;
  rsvp?: {
    enabled: boolean;
    deadline?: string;
    showEmail?: boolean;
    showDietaryRestrictions?: boolean;
  };
  audio?: { enabled: boolean; src: string; artist: string; title: string };
  bottomHero?: {
    enabled: boolean;
    mediaUrl: string;
    mediaType: "image" | "video";
    title: string;
    description: string;
  };
  socialPreview?: SocialPreview;
  ownerToken?: string;
}

interface Props {
  mode: "create" | "edit";
  initialData: SaveTheDateFormData;
  themes: SaveTheDateThemeData[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(bride: string, groom: string): string {
  return `${bride}-${groom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function deriveDateFields(iso: string) {
  if (!iso) return {};
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return {};
    return {
      day: String(d.getDate()).padStart(2, "0"),
      month: String(d.getMonth() + 1).padStart(2, "0"),
      year: String(d.getFullYear()),
      display: `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`,
    };
  } catch {
    return {};
  }
}

function colorPickerValue(value: string | undefined, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? "") ? value! : fallback;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SaveTheDateForm({ mode, initialData, themes }: Props) {
  const router = useRouter();
  const [data, setData] = useState<SaveTheDateFormData>(initialData);
  const [saving, setSaving] = useState(false);

  const selectedTheme = useMemo(
    () => themes.find((t) => t.id === data.themeId) || themes[0],
    [themes, data.themeId],
  );

  // Has envelope configured on theme?
  const hasEnvelope = Boolean(selectedTheme?.envelope);

  // Build merged envelope theme for the preview
  const envelopeTheme = useMemo(() => {
    if (!selectedTheme?.envelope) return null;
    const env = selectedTheme.envelope;
    const overrides = data.envelope;
    return {
      envelope: {
        base: overrides?.base || env.base,
        topFlap: overrides?.topFlap || env.topFlap,
        bottomFlap: overrides?.bottomFlap || env.bottomFlap,
      },
      bg: selectedTheme.bgColor,
    } as TemplateTheme;
  }, [selectedTheme, data.envelope]);

  const coverBackground = selectedTheme?.envelope
    ? getSaveTheDateEnvelopeCoverBackground(
        selectedTheme.envelope,
        data.envelope,
      )
    : undefined;

  // Preview data for SaveTheDateView
  const previewData = useMemo(
    () => ({
      id: data.id || "preview",
      slug: data.slug || "preview",
      couple: data.couple,
      date: data.date,
      customMessage: data.customMessage || null,
      theme: selectedTheme!,
      envelope: data.envelope || null,
      textStyles: data.textStyles || null,
      rsvp: data.rsvp || null,
      audio: data.audio || { enabled: false, src: "", artist: "", title: "" },
      bottomHero: data.bottomHero || null,
      socialPreview: data.socialPreview ?? null,
    }),
    [data, selectedTheme],
  );

  const resolvedSocialPreview = resolveSaveTheDateSocialPreview(
    previewData,
    typeof window !== "undefined" ? window.location.origin : "",
  );

  const updateCouple = useCallback(
    (field: "bride" | "groom", value: string) => {
      setData((prev) => {
        const couple = { ...prev.couple, [field]: value };
        return {
          ...prev,
          couple,
          slug:
            mode === "create" ? slugify(couple.bride, couple.groom) : prev.slug,
        };
      });
    },
    [mode],
  );

  const updateDate = useCallback((iso: string) => {
    const derived = deriveDateFields(iso);
    setData((prev) => ({
      ...prev,
      date: {
        iso,
        display: derived.display || prev.date.display,
        day: derived.day || prev.date.day,
        month: derived.month || prev.date.month,
        year: derived.year || prev.date.year,
      },
    }));
  }, []);

  const updateEnvelope = useCallback(
    <K extends keyof EnvelopeConfig>(key: K, value: EnvelopeConfig[K]) => {
      setData((prev) => ({
        ...prev,
        envelope: { ...prev.envelope, [key]: value },
      }));
    },
    [],
  );

  const updateAudio = useCallback(
    <K extends keyof NonNullable<SaveTheDateFormData["audio"]>>(
      key: K,
      value: NonNullable<SaveTheDateFormData["audio"]>[K],
    ) => {
      setData((prev) => ({
        ...prev,
        audio: {
          enabled: false,
          src: "",
          artist: "",
          title: "",
          ...prev.audio,
          [key]: value,
        },
      }));
    },
    [],
  );

  const updateTextStyleElement = useCallback(
    (
      element: keyof NonNullable<TextStyleOverrides["elements"]>,
      field: keyof TextStyle,
      value: string | number | undefined,
    ) => {
      setData((prev) => {
        const ts = prev.textStyles ?? {};
        const elements = { ...ts.elements };
        const el = { ...elements[element], [field]: value || undefined };
        const elHasAny = Object.values(el).some((v) => v !== undefined);
        elements[element] = elHasAny ? el : undefined;
        const hasAny = Object.values(elements).some(Boolean);
        return {
          ...prev,
          textStyles: { ...ts, elements: hasAny ? elements : undefined },
        };
      });
    },
    [],
  );

  const handleSubmit = async () => {
    if (
      !data.slug ||
      !data.themeId ||
      !data.couple.bride ||
      !data.couple.groom ||
      !data.date.iso
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/save-the-date"
          : `/api/admin/save-the-date/${data.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: data.slug,
          themeId: data.themeId,
          couple: data.couple,
          date: data.date,
          customMessage: data.customMessage || null,
          envelope: data.envelope || null,
          textStyles: data.textStyles || null,
          rsvp: data.rsvp || null,
          audio: data.audio || null,
          bottomHero: data.bottomHero || null,
          socialPreview: data.socialPreview ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao guardar");
      }

      const result = await res.json();
      toast.success(
        mode === "create"
          ? "Save the Date criado!"
          : "Save the Date atualizado!",
      );

      if (mode === "create") {
        router.push(`/admin/save-the-dates/${result.id}/edit`);
      }
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const hasNames = Boolean(data.couple.bride && data.couple.groom);

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0">
      {/* ── Left: form fields ─────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-w-0">
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === "create"
                ? "Novo Save the Date"
                : "Editar Save the Date"}
            </h1>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving
                ? "A guardar..."
                : mode === "create"
                  ? "Criar"
                  : "Guardar Alterações"}
            </Button>
          </div>

          {/* Owner link — only shown in edit mode when RSVP is enabled */}
          {mode === "edit" && data.ownerToken && data.rsvp?.enabled && (
            <OwnerLinkPanel
              ownerUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/confirmacoes/${data.ownerToken}`}
            />
          )}

          <Accordion defaultValue={[]} className="space-y-2">
            {/* ── Casal ── */}
            <AccordionItem value="couple" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Casal
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bride">Noiva</Label>
                    <Input
                      id="bride"
                      value={data.couple.bride}
                      onChange={(e) => updateCouple("bride", e.target.value)}
                      placeholder="e.g. Alba"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="groom">Noivo</Label>
                    <Input
                      id="groom"
                      value={data.couple.groom}
                      onChange={(e) => updateCouple("groom", e.target.value)}
                      placeholder="e.g. Javier"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={data.slug}
                    onChange={(e) =>
                      setData((p) => ({ ...p, slug: e.target.value }))
                    }
                    placeholder="alba-javier"
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Acessível em /s/{data.slug || "..."}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Modelo ── */}
            <AccordionItem value="theme" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Modelo
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="themeId">Tema</Label>
                  <Select
                    value={data.themeId}
                    onValueChange={(v) =>
                      setData((p) => ({ ...p, themeId: v || p.themeId }))
                    }
                  >
                    <SelectTrigger id="themeId">
                      <SelectValue placeholder="Selecionar tema..." />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Data ── */}
            <AccordionItem value="date" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Data & Hora
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dateIso">Data do Evento</Label>
                  <Input
                    id="dateIso"
                    type="date"
                    value={data.date.iso}
                    onChange={(e) => updateDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dia</Label>
                    <Input
                      value={data.date.day}
                      readOnly
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mês</Label>
                    <Input
                      value={data.date.month}
                      readOnly
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ano</Label>
                    <Input
                      value={data.date.year}
                      readOnly
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateDisplay">Texto de exibição</Label>
                  <Input
                    id="dateDisplay"
                    value={data.date.display}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        date: { ...p.date, display: e.target.value },
                      }))
                    }
                    placeholder="12 de Setembro de 2027"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Mensagem ── */}
            <AccordionItem value="message" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Mensagem Personalizada
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customMessage">
                    Mensagem (aparece após revelação)
                  </Label>
                  <Textarea
                    id="customMessage"
                    value={data.customMessage}
                    onChange={(e) =>
                      setData((p) => ({ ...p, customMessage: e.target.value }))
                    }
                    placeholder="estão convidados para celebrar o dia"
                    rows={3}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Este texto aparece acima da data, após o utilizador raspar o
                    coração.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Confirmação de Presença ── */}
            <AccordionItem value="rsvp" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Confirmação de Presença
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label>Activar confirmação de presença</Label>
                    <p className="text-xs text-muted-foreground">
                      Quando activo, os convidados verão um botão
                      &quot;Confirmar Presença&quot; em vez de (ou além de)
                      &quot;Add to Calendar&quot;.
                    </p>
                  </div>
                  <Switch
                    checked={data.rsvp?.enabled === true}
                    onCheckedChange={(v) =>
                      setData((p) => ({
                        ...p,
                        rsvp: { ...p.rsvp, enabled: v },
                      }))
                    }
                  />
                </div>
                {data.rsvp?.enabled && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="rsvpDeadline">
                        Prazo limite (opcional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          id="rsvpDeadline"
                          value={
                            data.rsvp?.deadline
                              ? (() => {
                                  // Parse "15 de Agosto de 2027" back to ISO for the date input
                                  const match = data.rsvp.deadline.match(
                                    /(\d+) de (\w+) de (\d{4})/,
                                  );
                                  if (match) {
                                    const monthIndex = MONTHS_PT.indexOf(
                                      match[2],
                                    );
                                    if (monthIndex !== -1) {
                                      const d = String(match[1]).padStart(
                                        2,
                                        "0",
                                      );
                                      const m = String(monthIndex + 1).padStart(
                                        2,
                                        "0",
                                      );
                                      return `${match[3]}-${m}-${d}`;
                                    }
                                  }
                                  return "";
                                })()
                              : ""
                          }
                          onChange={(e) => {
                            const iso = e.target.value;
                            if (!iso) {
                              setData((p) => ({
                                ...p,
                                rsvp: {
                                  ...p.rsvp,
                                  enabled: p.rsvp?.enabled ?? true,
                                  deadline: undefined,
                                },
                              }));
                              return;
                            }
                            const d = new Date(iso);
                            const display = `${d.getUTCDate()} de ${MONTHS_PT[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
                            setData((p) => ({
                              ...p,
                              rsvp: {
                                ...p.rsvp,
                                enabled: p.rsvp?.enabled ?? true,
                                deadline: display,
                              },
                            }));
                          }}
                          className="h-9 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring w-full"
                        />
                        {data.rsvp?.deadline && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-muted-foreground"
                            onClick={() =>
                              setData((p) => ({
                                ...p,
                                rsvp: {
                                  ...p.rsvp,
                                  enabled: p.rsvp?.enabled ?? true,
                                  deadline: undefined,
                                },
                              }))
                            }
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      {data.rsvp?.deadline && (
                        <p className="text-[11px] text-muted-foreground">
                          Será exibido como:{" "}
                          <strong>{data.rsvp.deadline}</strong>
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Texto mostrado no topo do formulário de confirmação.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label>Pedir email no RSVP</Label>
                        <p className="text-xs text-muted-foreground">
                          Quando activo, o formulário pede o email do convidado.
                        </p>
                      </div>
                      <Switch
                        checked={data.rsvp?.showEmail === true}
                        onCheckedChange={(v) =>
                          setData((p) => ({
                            ...p,
                            rsvp: {
                              ...p.rsvp,
                              enabled: p.rsvp?.enabled ?? true,
                              showEmail: v,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label>Pedir restrições alimentares no RSVP</Label>
                        <p className="text-xs text-muted-foreground">
                          Quando activo, o formulário pede as restrições
                          alimentares do convidado.
                        </p>
                      </div>
                      <Switch
                        checked={data.rsvp?.showDietaryRestrictions !== false}
                        onCheckedChange={(v) =>
                          setData((p) => ({
                            ...p,
                            rsvp: {
                              ...p.rsvp,
                              enabled: p.rsvp?.enabled ?? true,
                              showDietaryRestrictions: v,
                            },
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* ── Envelope overrides ── */}
            {hasEnvelope && (
              <AccordionItem
                value="envelope"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Envelope
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Base color */}
                  <div className="space-y-1.5">
                    <Label>Cor de fundo</Label>
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para usar a cor padrão do modelo (
                      {selectedTheme?.envelope?.base ?? ""})
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          data.envelope?.base ||
                          selectedTheme?.envelope?.base ||
                          "#ffffff"
                        }
                        onChange={(e) => updateEnvelope("base", e.target.value)}
                        className="h-9 w-9 rounded border cursor-pointer shrink-0"
                        title="Escolher cor"
                      />
                      <input
                        type="text"
                        value={data.envelope?.base ?? ""}
                        onChange={(e) => updateEnvelope("base", e.target.value)}
                        placeholder={`Padrão: ${selectedTheme?.envelope?.base ?? ""}`}
                        className="font-mono text-sm h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring"
                      />
                      {data.envelope?.base && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground"
                          onClick={() => updateEnvelope("base", "")}
                        >
                          Repor
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Cover background */}
                  <div className="space-y-1.5">
                    <Label>Fundo da capa</Label>
                    <p className="text-xs text-muted-foreground">
                      Cor ou imagem usada no fundo da capa do envelope. Deixe em
                      branco para usar a cor do envelope.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorPickerValue(
                          data.envelope?.coverBackground,
                          data.envelope?.base ||
                            selectedTheme?.envelope?.base ||
                            "#ffffff",
                        )}
                        onChange={(e) =>
                          updateEnvelope("coverBackground", e.target.value)
                        }
                        className="h-9 w-9 rounded border cursor-pointer shrink-0"
                        title="Escolher cor"
                      />
                      <input
                        type="text"
                        value={data.envelope?.coverBackground ?? ""}
                        onChange={(e) =>
                          updateEnvelope("coverBackground", e.target.value)
                        }
                        placeholder={`Padrão: ${data.envelope?.base || selectedTheme?.envelope?.base || ""}`}
                        className="font-mono text-sm h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring"
                      />
                      {data.envelope?.coverBackground && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground"
                          onClick={() => updateEnvelope("coverBackground", "")}
                        >
                          Repor
                        </Button>
                      )}
                    </div>
                    <MediaUpload
                      value={data.envelope?.coverBackground ?? ""}
                      onUpload={(url) => updateEnvelope("coverBackground", url)}
                      onClear={() => updateEnvelope("coverBackground", "")}
                      kind="image"
                      maxSizeMB={5}
                      label="Arraste uma imagem de fundo"
                    />
                  </div>

                  <Separator />

                  {/* Top flap image */}
                  <div className="space-y-1.5">
                    <Label>Imagem da aba superior</Label>
                    <p className="text-xs text-muted-foreground">
                      Imagem triangular que cobre a parte superior do envelope.
                      Deixe em branco para usar a imagem padrão.
                    </p>
                    <MediaUpload
                      value={data.envelope?.topFlap ?? ""}
                      onUpload={(url) => updateEnvelope("topFlap", url)}
                      onClear={() => updateEnvelope("topFlap", "")}
                      kind="image"
                      maxSizeMB={5}
                    />
                  </div>

                  <Separator />

                  {/* Bottom flap image */}
                  <div className="space-y-1.5">
                    <Label>Imagem da aba inferior</Label>
                    <p className="text-xs text-muted-foreground">
                      Imagem que cobre a parte inferior do envelope. Deixe em
                      branco para usar a imagem padrão.
                    </p>
                    <MediaUpload
                      value={data.envelope?.bottomFlap ?? ""}
                      onUpload={(url) => updateEnvelope("bottomFlap", url)}
                      onClear={() => updateEnvelope("bottomFlap", "")}
                      kind="image"
                      maxSizeMB={5}
                    />
                  </div>

                  <Separator />

                  {/* Shimmer toggle */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Efeito shimmer</Label>
                      <p className="text-xs text-muted-foreground">
                        Animação diagonal de brilho sobre a capa do envelope.
                      </p>
                    </div>
                    <Switch
                      checked={data.envelope?.shimmer !== false}
                      onCheckedChange={(v) => updateEnvelope("shimmer", v)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* ── Audio ── */}
            <AccordionItem value="audio" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium">
                Áudio {data.audio?.enabled ? "(ativo)" : "(desativado)"}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Áudio Ativado</Label>
                    <Switch
                      checked={data.audio?.enabled ?? false}
                      onCheckedChange={(v) => updateAudio("enabled", v)}
                    />
                  </div>
                  {data.audio?.enabled && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Ficheiro de Áudio</Label>
                        <MediaUpload
                          kind="audio"
                          maxSizeMB={20}
                          value={data.audio.src || undefined}
                          onUpload={(url) => updateAudio("src", url)}
                          onClear={() => updateAudio("src", "")}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="stdAudioArtist">Artista</Label>
                          <Input
                            id="stdAudioArtist"
                            value={data.audio.artist}
                            onChange={(e) =>
                              updateAudio("artist", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="stdAudioTitle">Título</Label>
                          <Input
                            id="stdAudioTitle"
                            value={data.audio.title}
                            onChange={(e) =>
                              updateAudio("title", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      {!hasEnvelope && (
                        <p className="text-xs text-muted-foreground">
                          O áudio só é reproduzido quando o Save the Date tem
                          envelope configurado.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Bottom Hero ── */}
            <AccordionItem
              value="bottomHero"
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="text-sm font-medium">
                Secção Inferior{" "}
                {data.bottomHero?.enabled ? "(ativa)" : "(desativada)"}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ativar secção inferior</Label>
                    <p className="text-xs text-muted-foreground">
                      Secção com imagem ou vídeo de fundo que aparece ao fazer
                      scroll.
                    </p>
                  </div>
                  <Switch
                    checked={data.bottomHero?.enabled ?? false}
                    onCheckedChange={(v) =>
                      setData((p) => ({
                        ...p,
                        bottomHero: {
                          enabled: v,
                          mediaUrl: p.bottomHero?.mediaUrl ?? "",
                          mediaType: p.bottomHero?.mediaType ?? "image",
                          title: p.bottomHero?.title ?? "",
                          description: p.bottomHero?.description ?? "",
                        },
                      }))
                    }
                  />
                </div>
                {data.bottomHero?.enabled && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Tipo de média</Label>
                      <Select
                        value={data.bottomHero.mediaType}
                        onValueChange={(v) =>
                          setData((p) => ({
                            ...p,
                            bottomHero: {
                              ...p.bottomHero!,
                              mediaType:
                                (v as "image" | "video") ||
                                p.bottomHero!.mediaType,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Imagem</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>
                        {data.bottomHero.mediaType === "video"
                          ? "Vídeo de fundo"
                          : "Imagem de fundo"}
                      </Label>
                      <MediaUpload
                        kind={data.bottomHero.mediaType}
                        maxSizeMB={
                          data.bottomHero.mediaType === "video" ? 100 : 5
                        }
                        value={data.bottomHero.mediaUrl || undefined}
                        onUpload={(url) =>
                          setData((p) => ({
                            ...p,
                            bottomHero: { ...p.bottomHero!, mediaUrl: url },
                          }))
                        }
                        onClear={() =>
                          setData((p) => ({
                            ...p,
                            bottomHero: { ...p.bottomHero!, mediaUrl: "" },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bottomHeroTitle">Título</Label>
                      <Input
                        id="bottomHeroTitle"
                        value={data.bottomHero.title}
                        onChange={(e) =>
                          setData((p) => ({
                            ...p,
                            bottomHero: {
                              ...p.bottomHero!,
                              title: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g. Vemo-nos em breve"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bottomHeroDesc">Descrição</Label>
                      <Textarea
                        id="bottomHeroDesc"
                        value={data.bottomHero.description}
                        onChange={(e) =>
                          setData((p) => ({
                            ...p,
                            bottomHero: {
                              ...p.bottomHero!,
                              description: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g. Mal podemos esperar para celebrar convosco"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <SocialPreviewSection
              accordionValue="socialPreview"
              value={data.socialPreview}
              onChange={(next) =>
                setData((p) => ({ ...p, socialPreview: next }))
              }
              resolvedImage={resolvedSocialPreview.image}
              resolvedTitle={resolvedSocialPreview.title}
              resolvedDescription={resolvedSocialPreview.description}
              publicUrl={
                data.slug
                  ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${data.slug}`
                  : undefined
              }
            />
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
            <div className="flex items-center gap-1">
              {mode === "edit" && data.slug ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <a
                          href={`/s/${data.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted transition-colors"
                        />
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>Ver página pública</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <ExternalLink className="h-4 w-4 opacity-40" />
              )}
            </div>
          </div>

          {/* ── Tab: Envelope preview ── */}
          {hasEnvelope && (
            <TabsContent
              value="envelope"
              className="flex-1 overflow-hidden m-0"
            >
              <div className="h-full relative overflow-hidden bg-neutral-200 max-h-165">
                {hasNames && envelopeTheme ? (
                  <EnvelopeCover
                    theme={envelopeTheme}
                    coverBackground={coverBackground}
                    onOpen={() => {}}
                    shimmer={data.envelope?.shimmer !== false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
                    Insira os nomes do casal para ver a pré-visualização
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
            <InlineTextEditProvider
              updateTextStyleElement={updateTextStyleElement}
              textStyles={data.textStyles}
            >
              <TextStyleToolbar />
              <div className="mx-auto origin-top w-full max-h-165 relative">
                {hasNames && selectedTheme ? (
                  <SaveTheDateView saveTheDate={previewData} hideEnvelope />
                ) : (
                  <div className="flex items-center justify-center h-96 text-muted-foreground text-sm text-center px-4">
                    Insira os nomes do casal para ver a pré-visualização
                  </div>
                )}
              </div>
            </InlineTextEditProvider>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
