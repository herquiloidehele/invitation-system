"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Video, Link2, CheckCircle2 } from "lucide-react";

import type {
  InvitationData,
  InvitationType,
  TemplateTheme,
  EnvelopeConfig,
} from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MediaUpload from "@/components/admin/MediaUpload";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import { OwnerLinkPanel } from "./OwnerLinkPanel";

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

function monogramFrom(bride: string, groom: string): string {
  const b = bride.trim().charAt(0).toUpperCase();
  const g = groom.trim().charAt(0).toUpperCase();
  return b && g ? `${b}&${g}` : "";
}

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

function getDefaultState(
  firstTheme?: TemplateTheme,
  invType: InvitationType = "external_video",
): InvitationData {
  return {
    slug: "",
    themeId: firstTheme?.id ?? "",
    template: firstTheme?.name ?? "pink-floral",
    couple: { bride: "", groom: "", monogram: "" },
    // These fields are required by the type but unused for external invitations
    date: {
      iso: "",
      display: "",
      dayOfWeek: "",
      time: "",
      day: "",
      month: "",
      year: "",
    },
    quote: "",
    location: { name: "", address: "", googleMapsUrl: "" },
    rsvp: { enabled: false },
    schedule: [],
    dressCode: { enabled: false, text: "" },
    giftRegistry: { enabled: false, text: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "",
    videoUrl: "",
    invitationType: invType,
    externalLink: "",
    saveDateStyle: "classic",
    envelope: {},
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExternalSubType = "external_video" | "external_link";

interface ExternalInvitationFormProps {
  initialData?: InvitationData & { id?: string };
  mode: "create" | "edit";
  invitationId?: string;
  ownerUrl?: string;
  themes: TemplateTheme[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExternalInvitationForm({
  initialData,
  mode,
  invitationId,
  ownerUrl,
  themes,
}: ExternalInvitationFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<InvitationData>(
    initialData ?? getDefaultState(themes[0]),
  );

  const subType = (form.invitationType ?? "external_video") as ExternalSubType;

  // Generic field updater
  const update = useCallback(
    <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Couple fields — auto-derive slug + monogram
  const updateCouple = useCallback(
    (field: "bride" | "groom", value: string) => {
      setForm((prev) => {
        const couple = { ...prev.couple, [field]: value };
        couple.monogram = monogramFrom(
          field === "bride" ? value : prev.couple.bride,
          field === "groom" ? value : prev.couple.groom,
        );
        const newSlug =
          mode === "create"
            ? slugify(
                field === "bride" ? value : prev.couple.bride,
                field === "groom" ? value : prev.couple.groom,
              )
            : prev.slug;
        return { ...prev, couple, slug: newSlug };
      });
    },
    [mode],
  );

  // Envelope overrides
  const updateEnvelope = useCallback(
    (field: keyof EnvelopeConfig, value: string | boolean) => {
      setForm((prev) => ({
        ...prev,
        envelope: { ...prev.envelope, [field]: value },
      }));
    },
    [],
  );

  // Switch sub-type
  const switchSubType = useCallback((t: ExternalSubType) => {
    setForm((prev) => ({
      ...prev,
      invitationType: t,
      videoUrl: t === "external_video" ? prev.videoUrl : "",
      externalLink: t === "external_link" ? prev.externalLink : "",
    }));
  }, []);

  // Current theme for cover preview
  const currentTheme = useMemo(() => {
    const base =
      themes.find((t) => t.id === form.themeId) ??
      themes.find((t) => t.name === form.template) ??
      themes[0];
    const overrides = form.envelope ?? {};
    return {
      ...base,
      envelope: {
        base: overrides.base || base?.envelope.base || "",
        topFlap: overrides.topFlap || base?.envelope.topFlap || "",
        bottomFlap: overrides.bottomFlap || base?.envelope.bottomFlap || "",
      },
    };
  }, [themes, form.themeId, form.template, form.envelope]);

  // Submit
  async function handleSubmit() {
    if (!form.slug) {
      toast.error("O slug é obrigatório");
      return;
    }
    if (!form.couple.bride || !form.couple.groom) {
      toast.error("Os nomes da noiva e do noivo são obrigatórios");
      return;
    }
    if (subType === "external_video" && !form.videoUrl) {
      toast.error("Carrega um vídeo para continuar");
      return;
    }
    if (subType === "external_link" && !form.externalLink) {
      toast.error("Introduz o link externo para continuar");
      return;
    }

    setSaving(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/invitations"
          : `/api/admin/invitations/${invitationId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao guardar");
      }

      const data = await res.json();
      toast.success(
        mode === "create" ? "Convite externo criado!" : "Convite atualizado!",
      );
      if (mode === "create") {
        router.push(`/admin/invitations/${data.id}/edit`);
      }
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao guardar convite",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* ──────────── Left: Form ──────────── */}
      <div className="w-full min-w-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {mode === "create"
                    ? "Novo Convite Externo"
                    : "Editar Convite Externo"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Capa animada + vídeo ou link externo em ecrã completo
                </p>
              </div>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving
                  ? "A guardar..."
                  : mode === "create"
                    ? "Criar"
                    : "Guardar Alterações"}
              </Button>
            </div>

            {/* Owner link (edit only) */}
            {mode === "edit" && ownerUrl && (
              <OwnerLinkPanel ownerUrl={ownerUrl} />
            )}

            {/* ── Sub-type picker ── */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Tipo de convite externo
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      value: "external_video" as ExternalSubType,
                      icon: Video,
                      title: "Vídeo",
                      desc: "Abre um vídeo em ecrã completo",
                    },
                    {
                      value: "external_link" as ExternalSubType,
                      icon: Link2,
                      title: "Link Externo",
                      desc: "Incorpora um site externo em ecrã completo",
                    },
                  ] as const
                ).map(({ value, icon: Icon, title, desc }) => {
                  const selected = subType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => switchSubType(value)}
                      className={`relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all cursor-pointer ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {selected && (
                        <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-primary" />
                      )}
                      <Icon
                        className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${selected ? "text-primary" : ""}`}
                        >
                          {title}
                        </p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* ── Couple names ── */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Casal</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="bride"
                    className="text-xs text-muted-foreground"
                  >
                    Noiva
                  </Label>
                  <Input
                    id="bride"
                    value={form.couple.bride}
                    onChange={(e) => updateCouple("bride", e.target.value)}
                    placeholder="ex: Sofia"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="groom"
                    className="text-xs text-muted-foreground"
                  >
                    Noivo
                  </Label>
                  <Input
                    id="groom"
                    value={form.couple.groom}
                    onChange={(e) => updateCouple("groom", e.target.value)}
                    placeholder="ex: Miguel"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="monogram"
                    className="text-xs text-muted-foreground"
                  >
                    Monograma
                  </Label>
                  <Input
                    id="monogram"
                    value={form.couple.monogram}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        couple: { ...prev.couple, monogram: e.target.value },
                      }))
                    }
                    placeholder="ex: S&M"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="slug"
                    className="text-xs text-muted-foreground"
                  >
                    Slug (URL)
                  </Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    placeholder="ex: sofia-miguel"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Theme ── */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tema (capa)</Label>
              <Select
                value={form.themeId}
                onValueChange={(val) => {
                  const t = themes.find((th) => th.id === val);
                  if (t) {
                    setForm((prev) => ({
                      ...prev,
                      themeId: t.id,
                      template: t.name,
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleciona um tema" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: t.envelope.base }}
                        />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* ── Envelope editor ── */}
            <Accordion defaultValue={[]} className="w-full">
              <AccordionItem
                value="envelope"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Personalizar capa
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Base color */}
                  <div className="space-y-1.5">
                    <Label>Cor de fundo</Label>
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para usar a cor padrão do modelo (
                      {currentTheme?.envelope.base ?? ""})
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          form.envelope?.base ||
                          currentTheme?.envelope.base ||
                          "#ffffff"
                        }
                        onChange={(e) => updateEnvelope("base", e.target.value)}
                        className="h-9 w-9 rounded border cursor-pointer shrink-0"
                        title="Escolher cor"
                      />
                      <input
                        type="text"
                        value={form.envelope?.base ?? ""}
                        onChange={(e) => updateEnvelope("base", e.target.value)}
                        placeholder={`Padrão: ${currentTheme?.envelope.base ?? ""}`}
                        className="font-mono text-sm h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring"
                      />
                      {form.envelope?.base && (
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

                  {/* Top flap image */}
                  <div className="space-y-1.5">
                    <Label>Imagem da aba superior</Label>
                    <p className="text-xs text-muted-foreground">
                      Imagem triangular que cobre a parte superior do envelope.
                      Deixe em branco para usar a imagem padrão.
                    </p>
                    <MediaUpload
                      value={form.envelope?.topFlap ?? ""}
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
                      value={form.envelope?.bottomFlap ?? ""}
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
                      checked={form.envelope?.shimmer !== false}
                      onCheckedChange={(v) => updateEnvelope("shimmer", v)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Separator />

            {/* ── Video upload (conditional) ── */}
            {subType === "external_video" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Vídeo</Label>
                <p className="text-xs text-muted-foreground">
                  Abre em ecrã completo com reprodução automática, sem controlos
                </p>
                <MediaUpload
                  kind="video"
                  maxSizeMB={500}
                  value={form.videoUrl}
                  onUpload={(url) => update("videoUrl", url)}
                  onClear={() => update("videoUrl", "")}
                />
              </div>
            )}

            {/* ── External link (conditional) ── */}
            {subType === "external_link" && (
              <div className="space-y-1.5">
                <Label htmlFor="externalLink" className="text-sm font-medium">
                  Link externo
                </Label>
                <p className="text-xs text-muted-foreground">
                  O site externo será incorporado em ecrã completo após a
                  abertura da capa
                </p>
                <Input
                  id="externalLink"
                  type="url"
                  value={form.externalLink ?? ""}
                  onChange={(e) => update("externalLink", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ──────────── Right: Cover preview ──────────── */}
      <div className="hidden lg:flex flex-col gap-4 w-[340px] shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Pré-visualização da capa
        </p>
        <div
          className="relative overflow-hidden rounded-2xl shadow-xl"
          style={{ height: "600px", maxWidth: "340px" }}
        >
          {currentTheme && (
            <EnvelopeCover
              theme={currentTheme}
              onOpen={() => {}}
              monogram={form.couple.monogram || "A&B"}
              shimmer={form.envelope?.shimmer !== false}
              imageSettings={form.imageSettings}
            />
          )}
        </div>
        {/* Info pill */}
        <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-1">
          <p className="text-xs font-medium">
            {subType === "external_video" ? "Após a capa:" : "Após a capa:"}
          </p>
          <p className="text-xs text-muted-foreground">
            {subType === "external_video"
              ? "Vídeo em ecrã completo com reprodução automática"
              : "Site externo incorporado em ecrã completo"}
          </p>
        </div>
      </div>
    </div>
  );
}
