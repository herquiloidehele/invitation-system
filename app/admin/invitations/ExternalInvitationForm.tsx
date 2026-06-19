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
  CardSectionKey,
  CardStyle,
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
import { ColorArrayField } from "@/components/admin/ColorArrayField";
import { Textarea } from "@/components/ui/textarea";
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
import HeroMediaFitSelect from "@/components/admin/HeroMediaFitSelect";
import SocialPreviewSection from "@/components/admin/SocialPreviewSection";
import HeroTextEditor from "@/components/admin/HeroTextEditor";
import { EMPTY_HERO_TEXT_LAYER, heroFontsFromTheme } from "@/lib/hero-text";
import GuestListEditor from "@/components/admin/GuestListEditor";
import { resolveBrowserUiColor } from "@/lib/browser-ui-color";
import { resolveInvitationSocialPreview } from "@/lib/social-preview";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import { InlineTextEditProvider } from "@/components/shared/EditableText";
import { InlineCardEditProvider } from "@/components/shared/EditableCard";
import TextStyleToolbar from "@/components/admin/TextStyleToolbar";
import CardStyleToolbar from "@/components/admin/CardStyleToolbar";
import CurtainCanvaPage from "@/components/curtain-canva/CurtainCanvaPage";
import VideoEntrancePage from "@/components/video-entrance/VideoEntrancePage";
import { PREVIEW_SAMPLE_GUEST } from "@/components/shared/PersonalGuestCard";
import RichExternalLinkPage from "@/components/shared/RichExternalLinkPage";
import { isCurtainCanvaLayout } from "@/lib/curtain-canva";
import {
  DEFAULT_HERO_REVEAL_SECONDS,
  isVideoEntranceLayout,
} from "@/lib/video-entrance";
import {
  getExternalInvitationEmbedSrc,
  getExternalInvitationPublicHref,
  hasRichExternalSections,
  shouldShowExternalInvitationAudioControls,
} from "@/lib/external-invitation-form";
import { DEFAULT_GUEST_MESSAGE_TEMPLATE } from "@/lib/guest-links";
import { OwnerLinkPanel } from "./OwnerLinkPanel";
import { LandingMetadataFieldset } from "@/components/admin/LandingMetadataFieldset";

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

const DEFAULT_SCRIM_OPACITY = 0.38;
const DEFAULT_GRADIENT_START_VIDEO = 40;
const DEFAULT_GRADIENT_START_IMAGE = 35;

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
      showOnExternalPage: false,
      backgroundImageUrl: "",
    },
    schedule: [],
    dressCode: { enabled: false, text: "" },
    giftRegistry: { enabled: false, text: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "",
    heroHeight: DEFAULT_HERO_HEIGHT,
    videoUrl: "",
    videoPoster: "",
    curtainVideoUrl: "",
    curtainVideoPoster: "",
    invitationType: invType,
    externalLink: "",
    isDemo: false,
    saveDateStyle: "classic",
    envelope: {},
    parents: {
      enabled: false,
      inviteMessage: "",
      blessingMessage: "",
      bridesFather: "",
      bridesMother: "",
      groomsFather: "",
      groomsMother: "",
    },
    scratchReveal: { enabled: false },
    heroConfetti: { enabled: true },
    countdown: { enabled: false },
    imageSettings: {},
    guestManagementEnabled: false,
    ownerCanAddGuests: false,
    guestMessageTemplate: DEFAULT_GUEST_MESSAGE_TEMPLATE,
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
  const [heroTextEditorOpen, setHeroTextEditorOpen] = useState(false);

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

  const updateEnvelopeConfetti = useCallback(
    (patch: Partial<NonNullable<EnvelopeConfig["confetti"]>>) => {
      setForm((prev) => {
        const current = prev.envelope?.confetti ?? { enabled: false };
        return {
          ...prev,
          envelope: {
            ...prev.envelope,
            confetti: { ...current, ...patch },
          },
        };
      });
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
        parents: { ...(prev.parents ?? {}), [field]: value } as NonNullable<
          InvitationData["parents"]
        >,
      }));
    },
    [],
  );

  const updateScratchReveal = useCallback((enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      scratchReveal: { ...(prev.scratchReveal ?? {}), enabled },
    }));
  }, []);

  const updateScratchRevealField = useCallback(
    <K extends keyof NonNullable<InvitationData["scratchReveal"]>>(
      field: K,
      value: NonNullable<InvitationData["scratchReveal"]>[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        scratchReveal: {
          ...(prev.scratchReveal ?? { enabled: false }),
          [field]: value,
        },
      }));
    },
    [],
  );

  const updatePersonalGuestCard = useCallback(
    <K extends keyof NonNullable<InvitationData["personalGuestCard"]>>(
      field: K,
      value: NonNullable<InvitationData["personalGuestCard"]>[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        personalGuestCard: {
          ...(prev.personalGuestCard ?? {}),
          [field]: value,
        },
      }));
    },
    [],
  );

  const updateHeroConfetti = useCallback((enabled: boolean) => {
    setForm((prev) => ({ ...prev, heroConfetti: { enabled } }));
  }, []);

  const updateCountdown = useCallback(
    <K extends keyof NonNullable<InvitationData["countdown"]>>(
      field: K,
      value: NonNullable<InvitationData["countdown"]>[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        countdown: {
          ...(prev.countdown ?? { enabled: false }),
          [field]: value,
        },
      }));
    },
    [],
  );

  const countdownCardStyles = useMemo(
    () => ({
      countdown: {
        cardBg: form.countdown?.cardBg,
        cardBorder: form.countdown?.cardBorder,
        borderRadius: form.countdown?.cardBorderRadius,
      },
    }),
    [
      form.countdown?.cardBg,
      form.countdown?.cardBorder,
      form.countdown?.cardBorderRadius,
    ],
  );

  const updateCountdownCardStyle = useCallback(
    (
      section: CardSectionKey,
      field: keyof CardStyle,
      value: string | number | undefined,
    ) => {
      if (section !== "countdown") return;
      if (field === "cardBg") {
        updateCountdown("cardBg", value as string | undefined);
      }
      if (field === "cardBorder") {
        updateCountdown("cardBorder", value as string | undefined);
      }
      if (field === "borderRadius") {
        updateCountdown("cardBorderRadius", value as number | undefined);
      }
    },
    [updateCountdown],
  );

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
        const preserveVideo =
          isCurtainCanvaLayout(selectedTheme) ||
          isVideoEntranceLayout(selectedTheme);

        return {
          ...prev,
          invitationType: t,
          videoUrl:
            t === "external_video" || preserveVideo ? prev.videoUrl : "",
          // Curtain video only applies to curtain-canva; keep it when the
          // selected theme is curtain-canva, otherwise clear it.
          curtainVideoUrl: preserveVideo ? prev.curtainVideoUrl : "",
          curtainVideoPoster: preserveVideo ? prev.curtainVideoPoster : "",
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

  // Hero free-text editor inputs (static still + scaled surface + fonts)
  const heroTextStillUrl = form.videoUrl
    ? (form.videoPoster ?? form.heroImage)
    : form.heroImage;
  const heroTextAspect = form.videoUrl
    ? 390 / 780
    : 390 / (form.heroHeight ?? DEFAULT_HERO_HEIGHT);
  const heroTextFonts = heroFontsFromTheme(currentTheme, form.textStyles);

  // True when the selected theme uses the curtain-canva renderer.
  // Drives the conditional fields accordion and the preview swap.
  const isCurtainCanva = useMemo(
    () => isCurtainCanvaLayout(currentTheme),
    [currentTheme],
  );

  const isVideoEntrance = useMemo(
    () => isVideoEntranceLayout(currentTheme),
    [currentTheme],
  );

  // Inject a sample guest so the personal guest card (and its background image)
  // renders in the live preview for guest-managed video-entrance / curtain-canva
  // invitations — the editor itself has no real per-recipient guest.
  const previewInvitation = useMemo(
    () =>
      form.guestManagementEnabled
        ? { ...form, guest: form.guest ?? PREVIEW_SAMPLE_GUEST }
        : form,
    [form],
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

            {/* ── Accordion: all settings ── */}
            <Accordion defaultValue={[]} className="space-y-2">
              {/* ── Couple ── */}
              <AccordionItem value="couple" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  {isWedding ? "Casal" : "Pessoa / Evento"}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
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
                          onChange={(e) =>
                            updateCouple("groom", e.target.value)
                          }
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
                            couple: {
                              ...prev.couple,
                              monogram: e.target.value,
                            },
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
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="external-isDemo">
                        Convite de demonstração
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Marca este convite como demo apenas na área admin.
                      </p>
                    </div>
                    <Switch
                      id="external-isDemo"
                      checked={form.isDemo === true}
                      onCheckedChange={(checked) => update("isDemo", checked)}
                    />
                  </div>

                  <LandingMetadataFieldset
                    value={{
                      priceFromCents: form.priceFromCents ?? null,
                      discountPriceFromCents:
                        form.discountPriceFromCents ?? null,
                      currency: form.currency ?? "EUR",
                      priceOverrides: form.priceOverrides ?? null,
                      landingModelName: form.landingModelName ?? null,
                      landingImageUrl: form.landingImageUrl ?? null,
                      landingDescription: form.landingDescription ?? null,
                    }}
                    onChange={(next) => {
                      update("priceFromCents", next.priceFromCents);
                      update(
                        "discountPriceFromCents",
                        next.discountPriceFromCents,
                      );
                      update("currency", next.currency);
                      update("priceOverrides", next.priceOverrides);
                      update("landingModelName", next.landingModelName);
                      update("landingImageUrl", next.landingImageUrl);
                      update("landingDescription", next.landingDescription);
                    }}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* ── Envelope editor ── */}
              <AccordionItem
                value="envelope"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Personalizar capa
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Theme */}
                  <div className="space-y-1.5">
                    <Label>Tema</Label>
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
                      Cor usada pela barra do browser em mobile. Deixe em branco
                      para combinar automaticamente com a capa do envelope.
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

                  <Separator />

                  {/* Confetti on open */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Confetti ao abrir</Label>
                      <p className="text-xs text-muted-foreground">
                        Dispara um efeito de confetti quando o envelope termina
                        de abrir.
                      </p>
                    </div>
                    <Switch
                      checked={form.envelope?.confetti?.enabled === true}
                      onCheckedChange={(v) =>
                        updateEnvelopeConfetti({ enabled: v })
                      }
                    />
                  </div>

                  {form.envelope?.confetti?.enabled === true && (
                    <ColorArrayField
                      label="Cores do confetti (vazio = cores do tema)"
                      value={form.envelope?.confetti?.colors ?? []}
                      onChange={(colors) => updateEnvelopeConfetti({ colors })}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* ── Video upload (conditional) ── */}
              {subType === "external_video" && (
                <AccordionItem value="video" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium">
                    Vídeo
                  </AccordionTrigger>
                  <AccordionContent className="space-y-1.5 pb-4">
                    <p className="text-xs text-muted-foreground">
                      Abre em ecrã completo com reprodução automática, sem
                      controlos
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
                    <HeroMediaFitSelect
                      id="extVideoMediaFit"
                      value={form.heroMediaFit}
                      onChange={(v) => update("heroMediaFit", v)}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── External link (conditional) ── */}
              {subType === "external_link" && (
                <AccordionItem
                  value="externalLink"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-medium">
                    Link externo
                  </AccordionTrigger>
                  <AccordionContent className="space-y-1.5 pb-4">
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
                    <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">
                        Personalização no design Canva
                      </p>
                      <p>
                        No design Canva, escreve estes marcadores (cada um como
                        um elemento de texto, num único estilo) onde queres os
                        dados do convidado:
                      </p>
                      <ul className="list-disc pl-4">
                        <li>
                          <code>{"{{nome}}"}</code> — nome do convidado
                        </li>
                        <li>
                          <code>{"{{acompanhante}}"}</code> — acompanhante
                        </li>
                        <li>
                          <code>{"{{mesa}}"}</code> — mesa
                        </li>
                        <li>
                          <code>{"{{num_total}}"}</code> — nº de convidados
                        </li>
                      </ul>
                      <p>
                        Para nomes compridos ficarem centrados, dá à caixa de
                        texto do marcador uma <strong>largura fixa</strong>{" "}
                        (arrasta as pegas laterais) com alinhamento ao centro —
                        senão a caixa cresce para o lado e o texto sai do centro.
                      </p>
                      <p>
                        O botão de confirmação deve apontar para{" "}
                        <code>/confirmar/&lt;slug&gt;</code> — o token do
                        convidado é acrescentado automaticamente.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── Rich sections for external_link ── */}
              {/* Optional Hero, ScratchDateReveal, and inline RSVP sections
                  composed around the embedded iframe. When all toggles are off
                  (and no heroImage / videoUrl is set) the public page renders
                  the bare fullscreen iframe behavior. */}
              {subType === "external_link" && (
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
                          Aparece no topo da página, antes do convite externo.
                          Deixa imagem e vídeo em branco para ocultar.
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
                              update("heroHeight", parseInt(e.target.value, 10))
                            }
                            className="w-full accent-foreground cursor-pointer"
                          />
                        </div>
                        {/* Hero overlay controls */}
                        <div className="space-y-3 pt-2">
                          {form.videoUrl ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="ellHeroScrimOpacity">
                                  Escurecimento do vídeo
                                </Label>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {Math.round(
                                    (form.heroOverlay?.scrimOpacity ??
                                      DEFAULT_SCRIM_OPACITY) * 100,
                                  )}
                                  %
                                </span>
                              </div>
                              <input
                                id="ellHeroScrimOpacity"
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={Math.round(
                                  (form.heroOverlay?.scrimOpacity ??
                                    DEFAULT_SCRIM_OPACITY) * 100,
                                )}
                                onChange={(e) =>
                                  update("heroOverlay", {
                                    ...(form.heroOverlay ?? {}),
                                    scrimOpacity:
                                      parseInt(e.target.value, 10) / 100,
                                  })
                                }
                                className="w-full accent-foreground cursor-pointer"
                              />
                            </div>
                          ) : null}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="ellHeroGradientStart">
                                Início do gradiente inferior
                              </Label>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {form.heroOverlay?.gradientStart ??
                                  (form.videoUrl
                                    ? DEFAULT_GRADIENT_START_VIDEO
                                    : DEFAULT_GRADIENT_START_IMAGE)}
                                %
                              </span>
                            </div>
                            <input
                              id="ellHeroGradientStart"
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={
                                form.heroOverlay?.gradientStart ??
                                (form.videoUrl
                                  ? DEFAULT_GRADIENT_START_VIDEO
                                  : DEFAULT_GRADIENT_START_IMAGE)
                              }
                              onChange={(e) =>
                                update("heroOverlay", {
                                  ...(form.heroOverlay ?? {}),
                                  gradientStart: parseInt(e.target.value, 10),
                                })
                              }
                              className="w-full accent-foreground cursor-pointer"
                            />
                          </div>
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
                            update("videoPoster", meta?.posterUrl ?? undefined);
                          }}
                          onClear={() => {
                            update("videoUrl", "");
                            update("videoPoster", "");
                          }}
                        />
                      </div>

                      <HeroMediaFitSelect
                        id="ellHeroMediaFit"
                        value={form.heroMediaFit}
                        onChange={(v) => update("heroMediaFit", v)}
                      />

                      {/* Free-positioned hero text */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="ellHideDefaultHeroText">
                            Ocultar textos predefinidos do hero
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Esconde os nomes, &amp; e citação predefinidos para
                            poder compor o hero livremente com textos próprios.
                          </p>
                        </div>
                        <Switch
                          id="ellHideDefaultHeroText"
                          checked={form.heroTextLayer?.hideDefaultText === true}
                          onCheckedChange={(checked) =>
                            update("heroTextLayer", {
                              ...(form.heroTextLayer ?? EMPTY_HERO_TEXT_LAYER),
                              hideDefaultText: checked,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setHeroTextEditorOpen(true)}
                        >
                          Editar textos do hero
                          {form.heroTextLayer?.blocks?.length
                            ? ` (${form.heroTextLayer.blocks.length})`
                            : ""}
                        </Button>
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
                                form.date.iso ? form.date.iso.split("T")[0] : ""
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
                            onCheckedChange={(v) => updateParents("enabled", v)}
                          />
                        </div>
                        {form.parents?.enabled && (
                          <div className="space-y-2 pt-2">
                            <Textarea
                              placeholder="Mensagem de bênção"
                              value={form.parents.blessingMessage ?? ""}
                              onChange={(e) =>
                                updateParents("blessingMessage", e.target.value)
                              }
                              rows={2}
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
                                  updateParents("bridesFather", e.target.value)
                                }
                              />
                              <Input
                                placeholder="Mãe da noiva"
                                value={form.parents.bridesMother ?? ""}
                                onChange={(e) =>
                                  updateParents("bridesMother", e.target.value)
                                }
                              />
                              <Input
                                placeholder="Pai do noivo"
                                value={form.parents.groomsFather ?? ""}
                                onChange={(e) =>
                                  updateParents("groomsFather", e.target.value)
                                }
                              />
                              <Input
                                placeholder="Mãe do noivo"
                                value={form.parents.groomsMother ?? ""}
                                onChange={(e) =>
                                  updateParents("groomsMother", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* COUNTDOWN SUBSECTION */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <Label>Contagem decrescente</Label>
                          <p className="text-xs text-muted-foreground">
                            Mostra uma secção animada com dias, horas, minutos e
                            segundos depois do hero e antes do convite externo.
                          </p>
                        </div>
                        <Switch
                          checked={form.countdown?.enabled === true}
                          onCheckedChange={(enabled) =>
                            updateCountdown("enabled", enabled)
                          }
                        />
                      </div>

                      {form.countdown?.enabled && (
                        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label htmlFor="countdownTitle">Título</Label>
                              <Input
                                id="countdownTitle"
                                value={form.countdown.title ?? ""}
                                onChange={(e) =>
                                  updateCountdown("title", e.target.value)
                                }
                                placeholder="Contagem Decrescente"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="countdownSubtitle">
                                Subtítulo
                              </Label>
                              <Input
                                id="countdownSubtitle"
                                value={form.countdown.subtitle ?? ""}
                                onChange={(e) =>
                                  updateCountdown("subtitle", e.target.value)
                                }
                                placeholder="Até ao nosso grande dia"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="countdownDaysLabel">
                                Etiqueta dias
                              </Label>
                              <Input
                                id="countdownDaysLabel"
                                value={form.countdown.daysLabel ?? ""}
                                onChange={(e) =>
                                  updateCountdown("daysLabel", e.target.value)
                                }
                                placeholder="DIAS"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="countdownHoursLabel">
                                Etiqueta horas
                              </Label>
                              <Input
                                id="countdownHoursLabel"
                                value={form.countdown.hoursLabel ?? ""}
                                onChange={(e) =>
                                  updateCountdown("hoursLabel", e.target.value)
                                }
                                placeholder="HORAS"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="countdownMinutesLabel">
                                Etiqueta minutos
                              </Label>
                              <Input
                                id="countdownMinutesLabel"
                                value={form.countdown.minutesLabel ?? ""}
                                onChange={(e) =>
                                  updateCountdown(
                                    "minutesLabel",
                                    e.target.value,
                                  )
                                }
                                placeholder="MINUTOS"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="countdownSecondsLabel">
                                Etiqueta segundos
                              </Label>
                              <Input
                                id="countdownSecondsLabel"
                                value={form.countdown.secondsLabel ?? ""}
                                onChange={(e) =>
                                  updateCountdown(
                                    "secondsLabel",
                                    e.target.value,
                                  )
                                }
                                placeholder="SEGUNDOS"
                              />
                            </div>
                          </div>

                          <SectionBackgroundImageEditor
                            value={form.countdown.backgroundImage ?? ""}
                            label="Imagem de fundo"
                            description="Fotografia de fundo opcional atrás da contagem decrescente. Sem imagem, a secção usa a cor de fundo configurada."
                            scrimLabel="Escurecimento da imagem"
                            maxSizeMB={8}
                            scrimOpacity={form.countdown.backgroundScrimOpacity}
                            onUpload={(url) =>
                              updateCountdown("backgroundImage", url)
                            }
                            onClear={() => {
                              updateCountdown("backgroundImage", "");
                              updateImageSettings(
                                "countdownBackground",
                                DEFAULT_IMAGE_SETTINGS,
                              );
                            }}
                            onScrimChange={(opacity) =>
                              updateCountdown("backgroundScrimOpacity", opacity)
                            }
                            positionSettings={imgSettings(
                              "countdownBackground",
                            )}
                            onPositionChange={(settings) =>
                              updateImageSettings(
                                "countdownBackground",
                                settings,
                              )
                            }
                            idPrefix="countdownBackground"
                          />

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="countdownBackgroundColor">
                                Cor de fundo
                              </Label>
                              <Input
                                id="countdownBackgroundColor"
                                value={form.countdown.backgroundColor ?? ""}
                                onChange={(e) =>
                                  updateCountdown(
                                    "backgroundColor",
                                    e.target.value,
                                  )
                                }
                                placeholder="#f4ecdc"
                                className="font-mono text-xs"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="countdownCardBorder">
                                Borda dos cartões
                              </Label>
                              <Input
                                id="countdownCardBorder"
                                value={form.countdown.cardBorder ?? ""}
                                onChange={(e) =>
                                  updateCountdown("cardBorder", e.target.value)
                                }
                                placeholder="#e7dcc9"
                                className="font-mono text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="countdownCardRadius">
                                Raio dos cartões
                              </Label>
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {form.countdown.cardBorderRadius ?? 18}px
                              </span>
                            </div>
                            <input
                              id="countdownCardRadius"
                              type="range"
                              min={0}
                              max={40}
                              step={1}
                              value={form.countdown.cardBorderRadius ?? 18}
                              onChange={(e) =>
                                updateCountdown(
                                  "cardBorderRadius",
                                  parseInt(e.target.value, 10),
                                )
                              }
                              className="w-full cursor-pointer accent-foreground"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* SCRATCH REVEAL SUBSECTION */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label>Revelação da data (raspadinha)</Label>
                        <p className="text-xs text-muted-foreground">
                          Mostra moedas raspadinhas com dia / mês / ano entre o
                          hero e o convite externo.
                        </p>
                      </div>
                      <Switch
                        checked={form.scratchReveal?.enabled === true}
                        onCheckedChange={updateScratchReveal}
                      />
                    </div>

                    {form.scratchReveal?.enabled === true && (
                      <SectionBackgroundImageEditor
                        value={form.scratchReveal?.backgroundImageUrl ?? ""}
                        label="Imagem de fundo"
                        description="Fotografia de fundo opcional atrás das moedas raspadinhas. Sem imagem, a secção usa a cor de fundo do tema."
                        scrimLabel="Escurecimento da imagem"
                        maxSizeMB={8}
                        scrimOpacity={form.scratchReveal?.scrimOpacity}
                        onUpload={(url) =>
                          updateScratchRevealField("backgroundImageUrl", url)
                        }
                        onClear={() => {
                          updateScratchRevealField("backgroundImageUrl", null);
                          updateImageSettings(
                            "scratchRevealBackground",
                            DEFAULT_IMAGE_SETTINGS,
                          );
                        }}
                        onScrimChange={(o) =>
                          updateScratchRevealField("scrimOpacity", o)
                        }
                        positionSettings={imgSettings(
                          "scratchRevealBackground",
                        )}
                        onPositionChange={(s) =>
                          updateImageSettings("scratchRevealBackground", s)
                        }
                        idPrefix="ccScratch"
                      />
                    )}

                    <Separator />

                    {/* RSVP NOTE */}
                    <p className="text-xs text-muted-foreground">
                      O formulário de RSVP é controlado na secção
                      &ldquo;Confirmação de presença&rdquo; abaixo e aparece no
                      fundo da página.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── Curtain-Canva extra fields ── */}
              {/* Visible only when the chosen theme uses the curtain-canva
                  layout. These fields are required by the CurtainCanvaPage
                  renderer (date for the scratch reveal, quote for the hero,
                  rsvp.enabled to show the inline RSVP form). */}
              {isCurtainCanva && (
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
                              form.date.iso ? form.date.iso.split("T")[0] : ""
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
                            onChange={(e) => updateDate("time", e.target.value)}
                            placeholder="16:00"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        A data de exibição, dia da semana, dia, mês e ano são
                        derivados automaticamente.
                      </p>
                    </div>

                    <Separator />

                    {/* Quote */}
                    <div className="space-y-1.5">
                      <Label htmlFor="ccQuote" className="text-sm font-medium">
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
                        Animação reproduzida quando o convidado toca para abrir.
                        Se ficar vazio, usa o vídeo padrão.
                      </p>
                      <MediaUpload
                        kind="video"
                        maxSizeMB={500}
                        value={form.curtainVideoUrl || undefined}
                        onUpload={(url, meta) => {
                          update("curtainVideoUrl", url);
                          // First-frame poster auto-extracted by the
                          // server. Used by CurtainsHero so iOS shows
                          // the closed-curtain still while the video
                          // loads, instead of a blank rectangle.
                          update("curtainVideoPoster", meta?.posterUrl ?? "");
                        }}
                        onClear={() => {
                          update("curtainVideoUrl", "");
                          update("curtainVideoPoster", "");
                        }}
                      />
                    </div>

                    <Separator />

                    {/* HERO CONFETTI TOGGLE */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label>Confetti no hero</Label>
                        <p className="text-xs text-muted-foreground">
                          Dispara um efeito de confetti quando as cortinas
                          terminam de abrir. Desliga para um hero mais sóbrio.
                        </p>
                      </div>
                      <Switch
                        checked={form.heroConfetti?.enabled !== false}
                        onCheckedChange={updateHeroConfetti}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── Video-Entrance extra fields ── */}
              {/* Visible only when the chosen theme uses the video-entrance
                  layout. Configures the single entrance video, the timed text
                  reveal, the hero text, and the shared external sections. */}
              {isVideoEntrance && (
                <AccordionItem
                  value="videoEntrance"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-medium">
                    Detalhes do convite (Vídeo de entrada)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-5 pb-4">
                    {/* Entrance video */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        Vídeo de entrada
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Vídeo único que serve de capa e hero. O convidado toca
                        para reproduzir.
                      </p>
                      <MediaUpload
                        kind="video"
                        maxSizeMB={500}
                        value={form.videoUrl || undefined}
                        onUpload={(url, meta) => {
                          update("videoUrl", url);
                          update("videoPoster", meta?.posterUrl ?? "");
                        }}
                        onClear={() => {
                          update("videoUrl", "");
                          update("videoPoster", "");
                        }}
                      />
                      <HeroMediaFitSelect
                        id="veHeroMediaFit"
                        value={form.heroMediaFit}
                        onChange={(v) => update("heroMediaFit", v)}
                      />
                    </div>

                    <Separator />

                    {/* Reveal timing */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="veRevealSeconds"
                        className="text-sm font-medium"
                      >
                        Tempo de revelação do texto (segundos)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Segundos após o início do vídeo em que o texto superior,
                        os nomes e a frase aparecem.
                      </p>
                      <Input
                        id="veRevealSeconds"
                        type="number"
                        min={0}
                        step={0.5}
                        value={form.heroRevealSeconds ?? ""}
                        placeholder={String(DEFAULT_HERO_REVEAL_SECONDS)}
                        onChange={(e) => {
                          const v = e.target.value;
                          const n = parseFloat(v);
                          update(
                            "heroRevealSeconds",
                            v === "" || Number.isNaN(n) ? undefined : n,
                          );
                        }}
                      />
                    </div>

                    <Separator />

                    {/* Top text */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="veTopText"
                        className="text-sm font-medium"
                      >
                        Texto superior
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Aparece acima dos nomes do casal no hero.
                      </p>
                      <Input
                        id="veTopText"
                        value={form.heroTopText ?? ""}
                        onChange={(e) => update("heroTopText", e.target.value)}
                        placeholder="ex: Vão casar-se"
                      />
                    </div>

                    {/* Quote */}
                    <div className="space-y-1.5">
                      <Label htmlFor="veQuote" className="text-sm font-medium">
                        Frase / citação
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Aparece sob os nomes do casal no hero.
                      </p>
                      <Input
                        id="veQuote"
                        value={form.quote}
                        onChange={(e) => update("quote", e.target.value)}
                        placeholder='ex: "O amor é paciente, o amor é bondoso."'
                      />
                    </div>

                    <Separator />

                    {/* Date (used by the scratch reveal) */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Data</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="veDateIso"
                            className="text-xs text-muted-foreground"
                          >
                            Data
                          </Label>
                          <Input
                            id="veDateIso"
                            type="date"
                            value={
                              form.date.iso ? form.date.iso.split("T")[0] : ""
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
                            htmlFor="veTime"
                            className="text-xs text-muted-foreground"
                          >
                            Hora
                          </Label>
                          <Input
                            id="veTime"
                            value={form.date.time}
                            onChange={(e) => updateDate("time", e.target.value)}
                            placeholder="16:00"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Hero overlay (scrim + gradient) */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="veScrimOpacity">
                            Escurecimento do vídeo
                          </Label>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {Math.round(
                              (form.heroOverlay?.scrimOpacity ??
                                DEFAULT_SCRIM_OPACITY) * 100,
                            )}
                            %
                          </span>
                        </div>
                        <input
                          id="veScrimOpacity"
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(
                            (form.heroOverlay?.scrimOpacity ??
                              DEFAULT_SCRIM_OPACITY) * 100,
                          )}
                          onChange={(e) =>
                            update("heroOverlay", {
                              ...(form.heroOverlay ?? {}),
                              scrimOpacity: parseInt(e.target.value, 10) / 100,
                            })
                          }
                          className="w-full accent-foreground cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="veGradientStart">
                            Início do gradiente inferior
                          </Label>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {form.heroOverlay?.gradientStart ??
                              DEFAULT_GRADIENT_START_VIDEO}
                            %
                          </span>
                        </div>
                        <input
                          id="veGradientStart"
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={
                            form.heroOverlay?.gradientStart ??
                            DEFAULT_GRADIENT_START_VIDEO
                          }
                          onChange={(e) =>
                            update("heroOverlay", {
                              ...(form.heroOverlay ?? {}),
                              gradientStart: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-foreground cursor-pointer"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Cover prompt (play button + tap hint) */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label>Botão de reprodução na capa</Label>
                        <p className="text-xs text-muted-foreground">
                          Mostra o botão de play e o texto &ldquo;Toque para
                          abrir&rdquo; sobre a capa. A capa continua a ser
                          tocável mesmo quando desligado.
                        </p>
                      </div>
                      <Switch
                        checked={form.heroTapPrompt !== false}
                        onCheckedChange={(v) => update("heroTapPrompt", v)}
                      />
                    </div>

                    <Separator />

                    {/* Confetti (opt-in / off by default) */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label>Confetti no hero</Label>
                        <p className="text-xs text-muted-foreground">
                          Dispara confetti quando o texto é revelado. Desligado
                          por defeito.
                        </p>
                      </div>
                      <Switch
                        checked={form.heroConfetti?.enabled === true}
                        onCheckedChange={updateHeroConfetti}
                      />
                    </div>

                    <Separator />

                    {/* Scratch reveal toggle */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label>Revelação da data (raspadinha)</Label>
                        <p className="text-xs text-muted-foreground">
                          Mostra moedas raspadinhas com dia / mês / ano entre o
                          hero e o convite externo.
                        </p>
                      </div>
                      <Switch
                        checked={form.scratchReveal?.enabled === true}
                        onCheckedChange={updateScratchReveal}
                      />
                    </div>

                    {form.scratchReveal?.enabled === true && (
                      <SectionBackgroundImageEditor
                        value={form.scratchReveal?.backgroundImageUrl ?? ""}
                        label="Imagem de fundo"
                        description="Fotografia de fundo opcional atrás das moedas raspadinhas. Sem imagem, a secção usa a cor de fundo do tema."
                        scrimLabel="Escurecimento da imagem"
                        maxSizeMB={8}
                        scrimOpacity={form.scratchReveal?.scrimOpacity}
                        onUpload={(url) =>
                          updateScratchRevealField("backgroundImageUrl", url)
                        }
                        onClear={() => {
                          updateScratchRevealField("backgroundImageUrl", null);
                          updateImageSettings(
                            "scratchRevealBackground",
                            DEFAULT_IMAGE_SETTINGS,
                          );
                        }}
                        onScrimChange={(o) =>
                          updateScratchRevealField("scrimOpacity", o)
                        }
                        positionSettings={imgSettings(
                          "scratchRevealBackground",
                        )}
                        onPositionChange={(s) =>
                          updateImageSettings("scratchRevealBackground", s)
                        }
                        idPrefix="veScratch"
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── Audio ── */}
              {showAudioControls && (
                <AccordionItem value="audio" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium">
                    Áudio de fundo
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label>Ativar áudio de fundo</Label>
                        <p className="text-xs text-muted-foreground">
                          Toca em background depois do convidado abrir a capa,
                          sem controlos visíveis.
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
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Mostrar player</Label>
                            <p className="text-xs text-muted-foreground">
                              Mostra os controlos de áudio no convite
                            </p>
                          </div>
                          <Switch
                            checked={form.audio.visibility ?? true}
                            onCheckedChange={(v) =>
                              updateAudio("visibility", v)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ── RSVP settings ── */}
              <AccordionItem value="rsvp" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  Confirmação de presença
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
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
                            Quando ativo, o formulário pede o email do
                            convidado.
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
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <Label>Mostrar RSVP no fim do convite externo</Label>
                          <p className="text-xs text-muted-foreground">
                            Quando ativo, a página externa (link Canva sem
                            secções extra) passa a ser rolável e mostra o
                            formulário após o conteúdo.
                          </p>
                        </div>
                        <Switch
                          checked={form.rsvp.showOnExternalPage === true}
                          onCheckedChange={(v) =>
                            updateRsvp("showOnExternalPage", v)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Imagem de fundo do RSVP</Label>
                        <p className="text-xs text-muted-foreground">
                          Usada no RSVP dentro do convite e na página de
                          confirmação. Máximo 500 KB.
                        </p>
                        <MediaUpload
                          kind="image"
                          maxSizeMB={0.5}
                          uploadProfile="rsvp-background"
                          value={form.rsvp.backgroundImageUrl || undefined}
                          onUpload={(url) =>
                            updateRsvp("backgroundImageUrl", url)
                          }
                          onClear={() => updateRsvp("backgroundImageUrl", "")}
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="guest-management"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Gestão de Convidados
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <Label className="cursor-pointer">
                        Activar gestão de convidados
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Quando activo, podes pré-registar convidados, gerar
                        links pessoais e enviar convites por WhatsApp ou SMS.
                      </p>
                    </div>
                    <Switch
                      checked={form.guestManagementEnabled === true}
                      onCheckedChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          guestManagementEnabled: value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <Label className="cursor-pointer">
                        Ocultar cartão do convidado nas pré-visualizações
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Quando activo, o cartão pessoal do convidado não aparece
                        nas pré-visualizações da página inicial. Continua
                        visível para os convidados reais.
                      </p>
                    </div>
                    <Switch
                      checked={form.personalGuestCard?.hideInPreview === true}
                      onCheckedChange={(value) =>
                        updatePersonalGuestCard("hideInPreview", value)
                      }
                    />
                  </div>

                  {form.guestManagementEnabled && (
                    <>
                      <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                        <div>
                          <Label className="cursor-pointer">
                            Permitir que o anfitrião adicione convidados
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Quando activo, o anfitrião pode adicionar convidados na
                            página de gestão dele. Quando desactivado, só tu podes
                            adicionar convidados aqui.
                          </p>
                        </div>
                        <Switch
                          checked={form.ownerCanAddGuests === true}
                          onCheckedChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              ownerCanAddGuests: value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="external-guest-msg-template">
                          Mensagem de convite (template)
                        </Label>
                        <Textarea
                          id="external-guest-msg-template"
                          rows={3}
                          value={
                            form.guestMessageTemplate ??
                            DEFAULT_GUEST_MESSAGE_TEMPLATE
                          }
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              guestMessageTemplate: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Usa <code>{"{name}"}</code> para o nome do convidado e{" "}
                          <code>{"{link}"}</code> para o link pessoal.
                        </p>
                      </div>

                      {initialData?.id ? (
                        <div className="rounded-lg border p-3">
                          <GuestListEditor
                            apiBasePath={`/api/admin/invitations/${initialData.id}/guests`}
                            invitationSlug={form.slug}
                            invitationOrigin={
                              typeof window !== "undefined"
                                ? window.location.origin
                                : ""
                            }
                            messageTemplate={
                              form.guestMessageTemplate ??
                              DEFAULT_GUEST_MESSAGE_TEMPLATE
                            }
                            title="Lista de convidados"
                            showCustomExternalLink={subType === "external_link"}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Guarda o convite primeiro para gerir a lista de
                          convidados.
                        </p>
                      )}

                      {(isVideoEntrance || isCurtainCanva) && (
                        <SectionBackgroundImageEditor
                          value={
                            form.personalGuestCard?.backgroundImageUrl ?? ""
                          }
                          label="Imagem de fundo do cartão do convidado"
                          description="Fotografia de fundo opcional atrás do cartão pessoal do convidado. Sem imagem, a secção usa a cor de fundo do tema."
                          scrimLabel="Escurecimento da imagem"
                          maxSizeMB={8}
                          scrimOpacity={form.personalGuestCard?.scrimOpacity}
                          onUpload={(url) =>
                            updatePersonalGuestCard("backgroundImageUrl", url)
                          }
                          onClear={() => {
                            updatePersonalGuestCard("backgroundImageUrl", null);
                            updateImageSettings(
                              "personalGuestCardBackground",
                              DEFAULT_IMAGE_SETTINGS,
                            );
                          }}
                          onScrimChange={(o) =>
                            updatePersonalGuestCard("scrimOpacity", o)
                          }
                          positionSettings={imgSettings(
                            "personalGuestCardBackground",
                          )}
                          onPositionChange={(s) =>
                            updateImageSettings("personalGuestCardBackground", s)
                          }
                          idPrefix="pgcBg"
                        />
                      )}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* ── Social Preview ── */}
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
              {isVideoEntrance ? (
                /* Video-entrance layout: render the actual public-facing page
                   so admins see the entrance video, timed text reveal, and the
                   external sections exactly as guests will. */
                <InlineTextEditProvider
                  updateTextStyleElement={updateTextStyleElement}
                  textStyles={form.textStyles}
                >
                  <InlineCardEditProvider
                    updateCardStyle={updateCountdownCardStyle}
                    cardStyles={countdownCardStyles}
                  >
                    <TextStyleToolbar />
                    <CardStyleToolbar />
                    <div className="absolute inset-0 overflow-y-auto bg-background">
                      <VideoEntrancePage
                        invitation={previewInvitation}
                        theme={currentTheme as TemplateTheme}
                      />
                    </div>
                  </InlineCardEditProvider>
                </InlineTextEditProvider>
              ) : isCurtainCanva ? (
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
                  <InlineCardEditProvider
                    updateCardStyle={updateCountdownCardStyle}
                    cardStyles={countdownCardStyles}
                  >
                    <TextStyleToolbar />
                    <CardStyleToolbar />
                    <div className="absolute inset-0 overflow-y-auto bg-background">
                      <CurtainCanvaPage
                        invitation={previewInvitation}
                        theme={currentTheme as TemplateTheme}
                      />
                    </div>
                  </InlineCardEditProvider>
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
                  <InlineCardEditProvider
                    updateCardStyle={updateCountdownCardStyle}
                    cardStyles={countdownCardStyles}
                  >
                    <TextStyleToolbar />
                    <CardStyleToolbar />
                    <div className="absolute inset-0 overflow-y-auto bg-background">
                      <RichExternalLinkPage
                        invitation={form}
                        theme={currentTheme as TemplateTheme}
                        isPreview
                      />
                    </div>
                  </InlineCardEditProvider>
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

      <HeroTextEditor
        open={heroTextEditorOpen}
        onOpenChange={setHeroTextEditorOpen}
        value={form.heroTextLayer}
        onChange={(next) => update("heroTextLayer", next)}
        stillUrl={heroTextStillUrl}
        aspectRatio={heroTextAspect}
        fonts={heroTextFonts}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionBackgroundImageEditor
//
// Inline editor block rendered under section toggles. Lets the admin upload (or
// clear) a full-bleed background image, fine-tune its position & zoom via
// ImagePositionEditor, and tune the dark scrim opacity used for legibility.
// ---------------------------------------------------------------------------

const DEFAULT_SCRATCH_SCRIM_OPACITY = 0.45;

function SectionBackgroundImageEditor({
  value,
  label,
  description,
  scrimLabel,
  maxSizeMB,
  scrimOpacity,
  onUpload,
  onClear,
  onScrimChange,
  positionSettings,
  onPositionChange,
  idPrefix,
}: {
  value: string;
  label: string;
  description: string;
  scrimLabel: string;
  maxSizeMB: number;
  scrimOpacity: number | undefined;
  onUpload: (url: string) => void;
  onClear: () => void;
  onScrimChange: (opacity: number) => void;
  positionSettings: ImageSettings;
  onPositionChange: (settings: ImageSettings) => void;
  idPrefix: string;
}) {
  const resolvedScrim = scrimOpacity ?? DEFAULT_SCRATCH_SCRIM_OPACITY;
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <MediaUpload
        kind="image"
        maxSizeMB={maxSizeMB}
        value={value || undefined}
        onUpload={onUpload}
        onClear={onClear}
      />
      {value && (
        <>
          <ImagePositionEditor
            src={value}
            settings={positionSettings}
            onChange={onPositionChange}
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}ScrimOpacity`}>{scrimLabel}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(resolvedScrim * 100)}%
              </span>
            </div>
            <input
              id={`${idPrefix}ScrimOpacity`}
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(resolvedScrim * 100)}
              onChange={(e) =>
                onScrimChange(parseInt(e.target.value, 10) / 100)
              }
              className="w-full cursor-pointer accent-foreground"
            />
          </div>
        </>
      )}
    </div>
  );
}
