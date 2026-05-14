"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Video,
  Link2,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

import type {
  InvitationData,
  InvitationEventType,
  InvitationType,
  TemplateTheme,
  EnvelopeConfig,
  TextStyle,
  TextStyleOverrides,
  ImageSettings,
  ImageSettingsKey,
} from "@/lib/types";
import { DEFAULT_IMAGE_SETTINGS } from "@/lib/types";
import {
  buildInvitationMonogram,
  buildInvitationSlug,
  isWeddingEventType,
} from "@/lib/invitation-event-types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MediaUpload from "@/components/admin/MediaUpload";
import ImagePositionEditor from "@/components/admin/ImagePositionEditor";
import SocialPreviewSection from "@/components/admin/SocialPreviewSection";
import { resolveBrowserUiColor } from "@/lib/browser-ui-color";
import { resolveInvitationSocialPreview } from "@/lib/social-preview";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import { InlineTextEditProvider } from "@/components/shared/EditableText";
import TextStyleToolbar from "@/components/admin/TextStyleToolbar";
import CurtainCanvaPage from "@/components/curtain-canva/CurtainCanvaPage";
import RichExternalLinkPage from "@/components/shared/RichExternalLinkPage";
import { isCurtainCanvaLayout } from "@/lib/curtain-canva";
import {
  getExternalInvitationEmbedSrc,
  getExternalInvitationPublicHref,
  hasRichExternalSections,
  shouldShowExternalInvitationAudioControls,
} from "@/lib/external-invitation-form";
import { OwnerLinkPanel } from "./OwnerLinkPanel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVENT_TYPE_OPTIONS: {
  value: InvitationEventType;
  label: string;
}[] = [
  { value: "wedding", label: "Casamento" },
  { value: "anniversary", label: "Aniversário" },
  { value: "baptism", label: "Batizado" },
  { value: "engagement", label: "Noivado" },
  { value: "other", label: "Outro" },
];

function colorPickerValue(value: string | undefined, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? "") ? value! : fallback;
}

const DEFAULT_HERO_HEIGHT = 300;
const MIN_HERO_HEIGHT = 200;
const MAX_HERO_HEIGHT = 700;
const HERO_HEIGHT_STEP = 10;

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
    eventType: "wedding",
    location: { name: "", address: "", googleMapsUrl: "" },
    rsvp: {
      enabled: false,
      showEmail: false,
      showDietaryRestrictions: true,
    },
    schedule: [],
    dressCode: { enabled: false, text: "" },
    giftRegistry: { enabled: false, text: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "",
    heroHeight: DEFAULT_HERO_HEIGHT,
    videoUrl: "",
    videoPoster: "",
    invitationType: invType,
    externalLink: "",
    saveDateStyle: "classic",
    envelope: {},
    parents: { enabled: false, inviteMessage: "", blessingMessage: "", bridesFather: "", bridesMother: "", groomsFather: "", groomsMother: "" },
    scratchReveal: { enabled: false },
    imageSettings: {},
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
// RsvpLinkPanel — shows the shareable /confirmar/[slug] URL
// ---------------------------------------------------------------------------

function RsvpLinkPanel({ slug }: { slug: string }) {
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );
  const [copied, setCopied] = useState(false);

  const rsvpUrl = origin ? `${origin}/confirmar/${slug}` : `/confirmar/${slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rsvpUrl);
      setCopied(true);
      toast.success("Link de confirmação copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Link de confirmação (RSVP)</p>
            <Badge variant="secondary" className="text-xs">
              Convidados
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Partilhe este link para os convidados confirmarem presença.
          </p>
        </div>
        <a
          href={rsvpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Abrir página de confirmação"
        >
          <ExternalLink className="size-4" />
        </a>
      </div>
      <div className="flex gap-2">
        <Input
          readOnly
          value={rsvpUrl}
          className="font-mono text-xs h-8 bg-background"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>
    </div>
  );
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

  const isWedding = isWeddingEventType(form.eventType);
  const subType = (form.invitationType ?? "external_video") as ExternalSubType;
  const resolvedSocialPreview = resolveInvitationSocialPreview(
    form,
    typeof window !== "undefined" ? window.location.origin : "",
  );
  const showAudioControls = shouldShowExternalInvitationAudioControls(subType);
  const publicHref = getExternalInvitationPublicHref(form.slug);
  const externalEmbedSrc = form.externalLink
    ? getExternalInvitationEmbedSrc(form.externalLink)
    : "";

  // Generic field updater
  const update = useCallback(
    <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Per-element text style override updater. Mirrors the helper in
  // InvitationForm so the curtain-canva preview supports the same inline
  // text editing UI (selects an EditableText element → toolbar updates
  // the matching entry in `form.textStyles.elements`). When all fields on
  // an element are cleared, the element is dropped; when no elements
  // remain, `textStyles.elements` itself is dropped.
  const updateTextStyleElement = useCallback(
    (
      element: keyof NonNullable<TextStyleOverrides["elements"]>,
      field: keyof TextStyle,
      value: string | number | undefined,
    ) => {
      setForm((prev) => {
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

  // Couple fields — auto-derive slug + monogram
  const updateCouple = useCallback(
    (field: "bride" | "groom", value: string) => {
      setForm((prev) => {
        const couple = { ...prev.couple, [field]: value };
        couple.monogram = buildInvitationMonogram({
          eventType: prev.eventType,
          primaryName: field === "bride" ? value : prev.couple.bride,
          secondaryName: field === "groom" ? value : prev.couple.groom,
        });
        const newSlug =
          mode === "create"
            ? buildInvitationSlug({
                eventType: prev.eventType,
                primaryName: field === "bride" ? value : prev.couple.bride,
                secondaryName: field === "groom" ? value : prev.couple.groom,
              })
            : prev.slug;
        return { ...prev, couple, slug: newSlug };
      });
    },
    [mode],
  );

  const updateEventType = useCallback(
    (eventType: InvitationEventType) => {
      setForm((prev) => {
        const couple = {
          ...prev.couple,
          monogram: buildInvitationMonogram({
            eventType,
            primaryName: prev.couple.bride,
            secondaryName: prev.couple.groom,
          }),
        };
        const next: InvitationData = { ...prev, eventType, couple };
        return mode === "create"
          ? {
              ...next,
              slug: buildInvitationSlug({
                eventType,
                primaryName: prev.couple.bride,
                secondaryName: prev.couple.groom,
              }),
            }
          : next;
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

  const updateAudio = useCallback(
    <K extends keyof InvitationData["audio"]>(
      field: K,
      value: InvitationData["audio"][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        audio: { ...prev.audio, [field]: value },
      }));
    },
    [],
  );

  const updateRsvp = useCallback(
    (field: keyof InvitationData["rsvp"], value: boolean | string) => {
      setForm((prev) => ({
        ...prev,
        rsvp: { ...prev.rsvp, [field]: value },
      }));
    },
    [],
  );

  const updateParents = useCallback(
    <K extends keyof NonNullable<InvitationData["parents"]>>(
      field: K,
      value: NonNullable<InvitationData["parents"]>[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        parents: { ...(prev.parents ?? {}), [field]: value } as NonNullable<InvitationData["parents"]>,
      }));
    },
    [],
  );

  const updateScratchReveal = useCallback((enabled: boolean) => {
    setForm((prev) => ({ ...prev, scratchReveal: { enabled } }));
  }, []);

  // Image position/zoom settings — used by ImagePositionEditor for the hero
  // image in rich external_link invitations.
  const updateImageSettings = useCallback(
    (key: ImageSettingsKey, settings: ImageSettings) => {
      setForm((prev) => ({
        ...prev,
        imageSettings: { ...prev.imageSettings, [key]: settings },
      }));
    },
    [],
  );

  const imgSettings = useCallback(
    (key: ImageSettingsKey): ImageSettings =>
      form.imageSettings?.[key] ?? DEFAULT_IMAGE_SETTINGS,
    [form.imageSettings],
  );

  // Date editor helper — only used by the curtain-canva accordion.
  // When the user picks an ISO date, derive display/dayOfWeek/day/month/year
  // (in pt-PT) so the renderer has every field it needs.
  const updateDate = useCallback(
    (field: keyof InvitationData["date"], value: string) => {
      setForm((prev) => {
        const next = { ...prev.date, [field]: value };
        if (field === "iso" && value) {
          try {
            const d = new Date(value);
            if (!Number.isNaN(d.getTime())) {
              const display = new Intl.DateTimeFormat("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(d);
              const dayOfWeek = new Intl.DateTimeFormat("pt-PT", {
                weekday: "long",
              }).format(d);
              const month = new Intl.DateTimeFormat("pt-PT", {
                month: "long",
              }).format(d);
              next.display = display;
              next.dayOfWeek = dayOfWeek;
              next.day = String(d.getUTCDate());
              next.month = month;
              next.year = String(d.getUTCFullYear());
            }
          } catch {
            /* ignore — leave derived fields untouched */
          }
        }
        return { ...prev, date: next };
      });
    },
    [],
  );

  // Switch sub-type
  const switchSubType = useCallback(
    (t: ExternalSubType) => {
      setForm((prev) => {
        const selectedTheme =
          themes.find((theme) => theme.id === prev.themeId) ??
          themes.find((theme) => theme.name === prev.template) ??
          themes[0];
        const preserveVideo = isCurtainCanvaLayout(selectedTheme);

        return {
          ...prev,
          invitationType: t,
          videoUrl: t === "external_video" || preserveVideo ? prev.videoUrl : "",
          externalLink: t === "external_link" ? prev.externalLink : "",
        };
      });
    },
    [themes],
  );

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

  // True when the selected theme uses the curtain-canva renderer.
  // Drives the conditional fields accordion and the preview swap.
  const isCurtainCanva = useMemo(
    () => isCurtainCanvaLayout(currentTheme),
    [currentTheme],
  );

  // Submit
  async function handleSubmit() {
    if (!form.slug) {
      toast.error("O slug é obrigatório");
      return;
    }
    if (!form.couple.bride || (isWedding && !form.couple.groom)) {
      toast.error(
        isWedding
          ? "Os nomes da noiva e do noivo são obrigatórios"
          : "O nome é obrigatório",
      );
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

            {/* RSVP confirmation link (edit only, external_link type) */}
            {mode === "edit" && subType === "external_link" && form.slug && (
              <RsvpLinkPanel slug={form.slug} />
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

            {/* ── RSVP settings ── */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Confirmação de presença
              </Label>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Ativar formulário de RSVP</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando ativo, o formulário aparece no fundo da página
                    (Curtain-Canva e link externo com secções extra).
                  </p>
                </div>
                <Switch
                  checked={form.rsvp.enabled === true}
                  onCheckedChange={(v) => updateRsvp("enabled", v)}
                />
              </div>
              {form.rsvp.enabled && (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Pedir email no RSVP</Label>
                      <p className="text-xs text-muted-foreground">
                        Quando ativo, o formulário pede o email do convidado.
                      </p>
                    </div>
                    <Switch
                      checked={form.rsvp.showEmail === true}
                      onCheckedChange={(v) => updateRsvp("showEmail", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Pedir restrições alimentares no RSVP</Label>
                      <p className="text-xs text-muted-foreground">
                        Quando ativo, o formulário pede as restrições
                        alimentares do convidado.
                      </p>
                    </div>
                    <Switch
                      checked={form.rsvp.showDietaryRestrictions !== false}
                      onCheckedChange={(v) =>
                        updateRsvp("showDietaryRestrictions", v)
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* ── Couple names ── */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {isWedding ? "Casal" : "Pessoa / Evento"}
              </Label>
              <div className="space-y-1.5">
                <Label
                  htmlFor="eventType"
                  className="text-xs text-muted-foreground"
                >
                  Tipo de convite
                </Label>
                <Select
                  value={form.eventType}
                  onValueChange={(value) =>
                    updateEventType(value as InvitationEventType)
                  }
                >
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="bride"
                    className="text-xs text-muted-foreground"
                  >
                    {isWedding ? "Noiva" : "Nome"}
                  </Label>
                  <Input
                    id="bride"
                    value={form.couple.bride}
                    onChange={(e) => updateCouple("bride", e.target.value)}
                    placeholder={isWedding ? "ex: Sofia" : "ex: Sofia"}
                  />
                </div>
                {isWedding && (
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
                )}
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
                          form.envelope?.coverBackground,
                          form.envelope?.base ||
                            currentTheme?.envelope.base ||
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
                        value={form.envelope?.coverBackground ?? ""}
                        onChange={(e) =>
                          updateEnvelope("coverBackground", e.target.value)
                        }
                        placeholder={`Padrão: ${form.envelope?.base || currentTheme?.envelope.base || ""}`}
                        className="font-mono text-sm h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring"
                      />
                      {form.envelope?.coverBackground && (
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
                      value={form.envelope?.coverBackground ?? ""}
                      onUpload={(url) => updateEnvelope("coverBackground", url)}
                      onClear={() => updateEnvelope("coverBackground", "")}
                      kind="image"
                      maxSizeMB={5}
                      label="Arraste uma imagem de fundo"
                    />
                  </div>

                  <Separator />

                  {/* Browser UI color */}
                  <div className="space-y-1.5">
                    <Label>Cor do browser</Label>
                    <p className="text-xs text-muted-foreground">
                      Cor usada pela barra do browser em mobile. Deixe em
                      branco para combinar automaticamente com a capa do
                      envelope.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorPickerValue(
                          form.envelope?.browserUiColor,
                          resolveBrowserUiColor({
                            envelope: form.envelope,
                            themeEnvelopeBase: currentTheme?.envelope.base,
                            pageBackground: currentTheme?.bg,
                          }) ?? "#ffffff",
                        )}
                        onChange={(e) =>
                          updateEnvelope("browserUiColor", e.target.value)
                        }
                        className="h-9 w-9 rounded border cursor-pointer shrink-0"
                        title="Escolher cor"
                      />
                      <input
                        type="text"
                        value={form.envelope?.browserUiColor ?? ""}
                        onChange={(e) =>
                          updateEnvelope("browserUiColor", e.target.value)
                        }
                        placeholder={`Automático: ${
                          resolveBrowserUiColor({
                            envelope: form.envelope,
                            themeEnvelopeBase: currentTheme?.envelope.base,
                            pageBackground: currentTheme?.bg,
                          }) ?? ""
                        }`}
                        className="font-mono text-sm h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring"
                      />
                      {form.envelope?.browserUiColor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground"
                          onClick={() => updateEnvelope("browserUiColor", "")}
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
                  onUpload={(url, meta) => {
                    update("videoUrl", url);
                    // The server-side ffmpeg job returns a poster URL on
                    // success. Persist it so the public renderer can show
                    // it as the <video> poster instead of a static asset.
                    update("videoPoster", meta?.posterUrl ?? "");
                  }}
                  onClear={() => {
                    update("videoUrl", "");
                    update("videoPoster", "");
                  }}
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

            {/* ── Rich sections for external_link ── */}
            {/* Optional Hero, ScratchDateReveal, and inline RSVP sections
                composed around the embedded iframe. When all toggles are off
                (and no heroImage / videoUrl is set) the public page renders
                the bare fullscreen iframe behavior. */}
            {subType === "external_link" && (
              <>
                <Separator />
                <Accordion defaultValue={[]} className="w-full">
                  <AccordionItem
                    value="externalLinkRich"
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-sm font-medium">
                      Conteúdo da página
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5 pb-4">
                      {/* HERO SUBSECTION */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium">Hero</h4>
                          <p className="text-xs text-muted-foreground">
                            Aparece no topo da página, antes do convite
                            externo. Deixa imagem e vídeo em branco para
                            ocultar.
                          </p>
                        </div>

                        {/* heroImage */}
                        <div className="space-y-1.5">
                          <Label>Imagem do hero</Label>
                          <MediaUpload
                            kind="image"
                            maxSizeMB={5}
                            value={form.heroImage || undefined}
                            onUpload={(url) => update("heroImage", url)}
                            onClear={() => update("heroImage", "")}
                          />
                          {form.heroImage && (
                            <ImagePositionEditor
                              src={form.heroImage}
                              settings={imgSettings("heroImage")}
                              onChange={(s) =>
                                updateImageSettings("heroImage", s)
                              }
                            />
                          )}
                          <div className="space-y-1.5 pt-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="ellHeroHeight">
                                Altura do hero
                              </Label>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {form.heroHeight ?? DEFAULT_HERO_HEIGHT}px
                              </span>
                            </div>
                            <input
                              id="ellHeroHeight"
                              type="range"
                              min={MIN_HERO_HEIGHT}
                              max={MAX_HERO_HEIGHT}
                              step={HERO_HEIGHT_STEP}
                              value={form.heroHeight ?? DEFAULT_HERO_HEIGHT}
                              onChange={(e) =>
                                update(
                                  "heroHeight",
                                  parseInt(e.target.value, 10),
                                )
                              }
                              className="w-full accent-foreground cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* videoUrl */}
                        <div className="space-y-1.5">
                          <Label>Vídeo do hero (opcional)</Label>
                          <p className="text-xs text-muted-foreground">
                            Quando definido, substitui a imagem do hero por um
                            vídeo de fundo a 100% da altura.
                          </p>
                          <MediaUpload
                            kind="video"
                            maxSizeMB={100}
                            value={form.videoUrl || undefined}
                            onUpload={(url, meta) => {
                              update("videoUrl", url);
                              update(
                                "videoPoster",
                                meta?.posterUrl ?? undefined,
                              );
                            }}
                            onClear={() => {
                              update("videoUrl", "");
                              update("videoPoster", "");
                            }}
                          />
                        </div>

                        {/* Monogram */}
                        <div className="space-y-1.5">
                          <Label htmlFor="ellMonogram">Monograma</Label>
                          <Input
                            id="ellMonogram"
                            value={form.couple.monogram}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                couple: {
                                  ...prev.couple,
                                  monogram: e.target.value,
                                },
                              }))
                            }
                            placeholder="A & B"
                          />
                        </div>

                        {/* Quote */}
                        <div className="space-y-1.5">
                          <Label htmlFor="ellQuote">Frase / citação</Label>
                          <Input
                            id="ellQuote"
                            value={form.quote}
                            onChange={(e) => update("quote", e.target.value)}
                            placeholder='ex: "O amor é paciente, o amor é bondoso."'
                          />
                        </div>

                        {/* Date */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Data</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="ellDateIso"
                                className="text-xs text-muted-foreground"
                              >
                                Data
                              </Label>
                              <Input
                                id="ellDateIso"
                                type="date"
                                value={
                                  form.date.iso
                                    ? form.date.iso.split("T")[0]
                                    : ""
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateDate(
                                    "iso",
                                    val ? `${val}T00:00:00.000Z` : "",
                                  );
                                }}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor="ellTime"
                                className="text-xs text-muted-foreground"
                              >
                                Hora
                              </Label>
                              <Input
                                id="ellTime"
                                value={form.date.time}
                                onChange={(e) =>
                                  updateDate("time", e.target.value)
                                }
                                placeholder="16:00"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Parents block */}
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label>Bênção dos pais</Label>
                              <p className="text-xs text-muted-foreground">
                                Aparece sobre o hero (mensagem de bênção + nomes
                                dos pais + mensagem de convite).
                              </p>
                            </div>
                            <Switch
                              checked={form.parents?.enabled === true}
                              onCheckedChange={(v) =>
                                updateParents("enabled", v)
                              }
                            />
                          </div>
                          {form.parents?.enabled && (
                            <div className="space-y-2 pt-2">
                              <Input
                                placeholder="Mensagem de bênção"
                                value={form.parents.blessingMessage ?? ""}
                                onChange={(e) =>
                                  updateParents(
                                    "blessingMessage",
                                    e.target.value,
                                  )
                                }
                              />
                              <Input
                                placeholder="Mensagem de convite"
                                value={form.parents.inviteMessage ?? ""}
                                onChange={(e) =>
                                  updateParents("inviteMessage", e.target.value)
                                }
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Pai da noiva"
                                  value={form.parents.bridesFather ?? ""}
                                  onChange={(e) =>
                                    updateParents(
                                      "bridesFather",
                                      e.target.value,
                                    )
                                  }
                                />
                                <Input
                                  placeholder="Mãe da noiva"
                                  value={form.parents.bridesMother ?? ""}
                                  onChange={(e) =>
                                    updateParents(
                                      "bridesMother",
                                      e.target.value,
                                    )
                                  }
                                />
                                <Input
                                  placeholder="Pai do noivo"
                                  value={form.parents.groomsFather ?? ""}
                                  onChange={(e) =>
                                    updateParents(
                                      "groomsFather",
                                      e.target.value,
                                    )
                                  }
                                />
                                <Input
                                  placeholder="Mãe do noivo"
                                  value={form.parents.groomsMother ?? ""}
                                  onChange={(e) =>
                                    updateParents(
                                      "groomsMother",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* SCRATCH REVEAL SUBSECTION */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <Label>Revelação da data (raspadinha)</Label>
                          <p className="text-xs text-muted-foreground">
                            Mostra moedas raspadinhas com dia / mês / ano entre
                            o hero e o convite externo.
                          </p>
                        </div>
                        <Switch
                          checked={form.scratchReveal?.enabled === true}
                          onCheckedChange={updateScratchReveal}
                        />
                      </div>

                      <Separator />

                      {/* RSVP NOTE */}
                      <p className="text-xs text-muted-foreground">
                        O formulário de RSVP é controlado na secção
                        &ldquo;Confirmação de presença&rdquo; acima e aparece
                        no fundo da página.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}

            {/* ── Curtain-Canva extra fields ── */}
            {/* Visible only when the chosen theme uses the curtain-canva
                layout. These fields are required by the CurtainCanvaPage
                renderer (date for the scratch reveal, quote for the hero,
                rsvp.enabled to show the inline RSVP form). */}
            {isCurtainCanva && (
              <>
                <Separator />
                <Accordion defaultValue={["curtainCanva"]} className="w-full">
                  <AccordionItem
                    value="curtainCanva"
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-sm font-medium">
                      Detalhes do convite (Curtain &amp; Canva)
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5 pb-4">
                      {/* Date */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Data</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="ccDateIso"
                              className="text-xs text-muted-foreground"
                            >
                              Data
                            </Label>
                            <Input
                              id="ccDateIso"
                              type="date"
                              value={
                                form.date.iso
                                  ? form.date.iso.split("T")[0]
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDate(
                                  "iso",
                                  val ? `${val}T00:00:00.000Z` : "",
                                );
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="ccTime"
                              className="text-xs text-muted-foreground"
                            >
                              Hora
                            </Label>
                            <Input
                              id="ccTime"
                              value={form.date.time}
                              onChange={(e) =>
                                updateDate("time", e.target.value)
                              }
                              placeholder="16:00"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          A data de exibição, dia da semana, dia, mês e ano
                          são derivados automaticamente.
                        </p>
                      </div>

                      <Separator />

                       {/* Quote */}
                       <div className="space-y-1.5">
                         <Label
                           htmlFor="ccQuote"
                           className="text-sm font-medium"
                         >
                           Frase / citação
                         </Label>
                         <p className="text-xs text-muted-foreground">
                           Aparece sob os nomes do casal no hero, depois das
                           cortinas abrirem.
                         </p>
                         <Input
                           id="ccQuote"
                           value={form.quote}
                           onChange={(e) => update("quote", e.target.value)}
                           placeholder='ex: "O amor é paciente, o amor é bondoso."'
                         />
                       </div>

                       {/* Invite message */}
                       <div className="space-y-1.5">
                         <Label
                           htmlFor="ccInviteMessage"
                           className="text-sm font-medium"
                         >
                           Mensagem de convite
                         </Label>
                         <p className="text-xs text-muted-foreground">
                           Aparece sob os nomes do casal no hero, após a frase.
                         </p>
                         <Input
                           id="ccInviteMessage"
                           value={form.parents?.inviteMessage ?? ""}
                           onChange={(e) =>
                             updateParents("inviteMessage", e.target.value)
                           }
                           placeholder="Convidamos para o nosso casamento"
                         />
                       </div>

                       <Separator />

                      {/* Curtain video */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                          Vídeo das cortinas
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Animação reproduzida quando o convidado toca para
                          abrir. Se ficar vazio, usa o vídeo padrão.
                        </p>
                        <MediaUpload
                          kind="video"
                          maxSizeMB={500}
                          value={form.videoUrl}
                          onUpload={(url, meta) => {
                            update("videoUrl", url);
                            // First-frame poster auto-extracted by the
                            // server. Used by CurtainsHero so iOS shows
                            // the closed-curtain still while the video
                            // loads, instead of a blank rectangle.
                            update("videoPoster", meta?.posterUrl ?? "");
                          }}
                          onClear={() => {
                            update("videoUrl", "");
                            update("videoPoster", "");
                          }}
                        />
                      </div>

                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}

            {showAudioControls && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Áudio de fundo</Label>
                      <p className="text-xs text-muted-foreground">
                        Toca em background depois do convidado abrir a capa, sem
                        controlos visíveis.
                      </p>
                    </div>
                    <Switch
                      checked={form.audio.enabled}
                      onCheckedChange={(v) => updateAudio("enabled", v)}
                    />
                  </div>
                  {form.audio.enabled && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Ficheiro de áudio</Label>
                        <MediaUpload
                          kind="audio"
                          maxSizeMB={20}
                          value={form.audio.src || undefined}
                          onUpload={(url) => updateAudio("src", url)}
                          onClear={() => updateAudio("src", "")}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="externalAudioArtist">Artista</Label>
                          <Input
                            id="externalAudioArtist"
                            value={form.audio.artist}
                            onChange={(e) =>
                              updateAudio("artist", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="externalAudioTitle">Título</Label>
                          <Input
                            id="externalAudioTitle"
                            value={form.audio.title}
                            onChange={(e) =>
                              updateAudio("title", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <Accordion defaultValue={[]} className="w-full">
              <SocialPreviewSection
                accordionValue="socialPreview"
                value={form.socialPreview}
                onChange={(next) =>
                  setForm((prev) => ({ ...prev, socialPreview: next }))
                }
                resolvedImage={resolvedSocialPreview.image}
                resolvedTitle={resolvedSocialPreview.title}
                resolvedDescription={resolvedSocialPreview.description}
                publicUrl={
                  form.slug
                    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${form.slug}`
                    : undefined
                }
              />
            </Accordion>
          </div>
        </ScrollArea>
      </div>

      {/* ──────────── Right: Live Preview ──────────── */}
      <div className="hidden lg:flex w-[35%] min-w-[380px] border-l flex-col h-full">
        <Tabs defaultValue="invite" className="flex flex-col h-full">
          <div className="px-4 pt-3 pb-0 border-b bg-muted/50 flex items-center justify-between gap-2 shrink-0">
            <TabsList className="h-8">
              <TabsTrigger value="envelope" className="text-xs px-3 h-7">
                Envelope
              </TabsTrigger>
              <TabsTrigger value="invite" className="text-xs px-3 h-7">
                Convite
              </TabsTrigger>
            </TabsList>
            <span className="text-xs text-muted-foreground shrink-0">
              {publicHref ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <a
                          href={publicHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted transition-colors"
                        />
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>Ver convite público</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <ExternalLink className="h-4 w-4 opacity-40" />
              )}
            </span>
          </div>

          <TabsContent value="envelope" className="flex-1 overflow-hidden m-0">
            <div className="h-full relative overflow-hidden bg-neutral-200 max-h-165">
              {currentTheme && (
                <EnvelopeCover
                  theme={currentTheme}
                  coverBackground={form.envelope?.coverBackground}
                  onOpen={() => {}}
                  monogram={form.couple.monogram || "A&B"}
                  shimmer={form.envelope?.shimmer !== false}
                  imageSettings={form.imageSettings}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="invite" className="flex-1 overflow-hidden m-0">
            <div className="relative h-full max-h-165 overflow-hidden bg-black">
              {isCurtainCanva ? (
                /* Curtain-Canva layout: render the actual public-facing page
                   so admins see exactly what guests will see (curtains hero,
                   scratch reveal, Canva iframe section, inline RSVP). The
                   preview is scrollable inside the pane.

                   Wrapping the preview with InlineTextEditProvider lights up
                   every <EditableText> in the curtain flow — clicking a name,
                   the ampersand, the quote, the scratch labels, etc. opens
                   the floating TextStyleToolbar so the admin can adjust per-
                   element font/size/weight/color overrides exactly like in
                   the standard invitation preview. */
                <InlineTextEditProvider
                  updateTextStyleElement={updateTextStyleElement}
                  textStyles={form.textStyles}
                >
                  <TextStyleToolbar />
                  <div className="absolute inset-0 overflow-y-auto bg-background">
                    <CurtainCanvaPage
                      invitation={form}
                      theme={currentTheme as TemplateTheme}
                    />
                  </div>
                </InlineTextEditProvider>
              ) : subType === "external_video" ? (
                form.videoUrl ? (
                  <video
                    src={form.videoUrl}
                    controls
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                    Carrega um vídeo para ver a pré-visualização do convite
                  </div>
                )
              ) : subType === "external_link" &&
                hasRichExternalSections(form) ? (
                /* Rich external_link layout: render the actual public-facing
                   page so admins see hero / scratch / iframe / RSVP composed
                   exactly as guests will. InlineTextEditProvider wires up the
                   TextStyleToolbar for per-element overrides. */
                <InlineTextEditProvider
                  updateTextStyleElement={updateTextStyleElement}
                  textStyles={form.textStyles}
                >
                  <TextStyleToolbar />
                  <div className="absolute inset-0 overflow-y-auto bg-background">
                    <RichExternalLinkPage
                      invitation={form}
                      theme={currentTheme as TemplateTheme}
                      isPreview
                    />
                  </div>
                </InlineTextEditProvider>
              ) : form.externalLink ? (
                <iframe
                  src={externalEmbedSrc}
                  title="Convite externo"
                  allowFullScreen
                  loading="eager"
                  className="absolute inset-0 h-full w-full border-0 bg-background"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                  Introduz o link externo para ver a pré-visualização do convite
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
