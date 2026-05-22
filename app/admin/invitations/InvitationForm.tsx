"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type {
  CardSectionKey,
  CardStyle,
  CustomTexts,
  EnvelopeConfig,
  GuestGuideItem,
  ImageSettings,
  ImageSettingsKey,
  InvitationData,
  InvitationEventType,
  LocationInfo,
  ParentsInfo,
  SaveDateStyle,
  ScheduleIcon,
  ScheduleStyle,
  SectionImages,
  TemplateTheme,
  TextStyle,
  TextStyleOverrides,
} from "@/lib/types";
import { DEFAULT_IMAGE_SETTINGS } from "@/lib/types";
import { CUSTOM_TEXT_GROUPS } from "@/lib/custom-texts";

import {
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvitationPage from "@/components/shared/InvitationPage";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import MediaUpload from "@/components/admin/MediaUpload";
import ImagePositionEditor from "@/components/admin/ImagePositionEditor";
import GuestGuideFormSection from "@/components/admin/GuestGuideFormSection";
import TextStyleToolbar from "@/components/admin/TextStyleToolbar";
import CardStyleToolbar from "@/components/admin/CardStyleToolbar";
import { InlineTextEditProvider } from "@/components/shared/EditableText";
import { InlineCardEditProvider } from "@/components/shared/EditableCard";
import { OwnerLinkPanel } from "./OwnerLinkPanel";
import GuestListEditor from "@/components/admin/GuestListEditor";
import SocialPreviewSection from "@/components/admin/SocialPreviewSection";
import { LandingMetadataFieldset } from "@/components/admin/LandingMetadataFieldset";
import { DEFAULT_GUEST_MESSAGE_TEMPLATE } from "@/lib/guest-links";
import { resolveBrowserUiColor } from "@/lib/browser-ui-color";
import { resolveInvitationSocialPreview } from "@/lib/social-preview";
import {
  buildInvitationMonogram,
  buildInvitationSlug,
  isWeddingEventType,
} from "@/lib/invitation-event-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function colorPickerValue(value: string | undefined, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? "") ? value! : fallback;
}

function deriveDateFields(iso: string) {
  if (!iso) return {};
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return {};
    const months = [
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
    const days = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    // Use UTC getters since the ISO string is stored as UTC (T00:00:00.000Z)
    // Using local-time getters causes off-by-one day errors due to timezone offset
    return {
      day: String(d.getUTCDate()).padStart(2, "0"),
      month: months[d.getUTCMonth()],
      year: String(d.getUTCFullYear()),
      dayOfWeek: days[d.getUTCDay()],
      display: `${d.getUTCDate()} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`,
    };
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAVE_DATE_STYLE_OPTIONS: {
  value: SaveDateStyle;
  label: string;
  description: string;
  preview: React.ReactNode;
}[] = [
  {
    value: "classic",
    label: "Clássico",
    description: "Cartão único com a data em destaque",
    preview: (
      <div className="flex flex-col items-center gap-0.5 py-1">
        <div className="text-[9px] tracking-widest opacity-60 uppercase">
          Save the Date
        </div>
        <div
          className="text-2xl font-light leading-none"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          20
        </div>
        <div className="text-[8px] tracking-[0.2em] uppercase opacity-70">
          Setembro
        </div>
        <div className="text-xs opacity-50">2025</div>
      </div>
    ),
  },
  {
    value: "countdown",
    label: "Contagem Regressiva",
    description: "Contador ao vivo em tempo real",
    preview: (
      <div className="flex flex-col items-center gap-1 py-1">
        <div className="text-[9px] tracking-widest opacity-60 uppercase">
          Save the Date
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {["32", "14", "07", "42"].map((n, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="bg-black/5 rounded px-1 py-0.5 text-sm font-light leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {n}
              </div>
              <div className="text-[6px] uppercase tracking-wider opacity-50 mt-0.5">
                {["D", "H", "M", "S"][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    value: "quad-cards",
    label: "4 Cartões",
    description: "Grade 2×2 com dia, mês, ano e dia da semana",
    preview: (
      <div className="flex flex-col items-center gap-1 py-1">
        <div className="text-[9px] tracking-widest opacity-60 uppercase">
          Save the Date
        </div>
        <div className="grid grid-cols-2 gap-1 mt-0.5">
          {[
            ["20", "Dia"],
            ["Set", "Mês"],
            ["2025", "Ano"],
            ["Sáb", "Semana"],
          ].map(([v, l], i) => (
            <div
              key={i}
              className="bg-black/5 rounded flex flex-col items-center px-2 py-1"
            >
              <span
                className="text-xs font-light leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {v}
              </span>
              <span className="text-[6px] uppercase tracking-wider opacity-50 mt-0.5">
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    value: "cinematic",
    label: "Cinemático",
    description: "Fotografia em destaque com faixa de data em baixo",
    preview: (
      <div className="flex flex-col w-full overflow-hidden rounded py-1">
        <div className="flex flex-col items-center bg-black/5 px-2 py-1.5">
          <div className="text-[9px] tracking-widest opacity-60 uppercase">
            Save the Date
          </div>
          <div
            className="text-base leading-none opacity-80 mt-0.5"
            style={{ fontFamily: "'Great Vibes', cursive" }}
          >
            Sofia &amp; Miguel
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 bg-black/[0.03] px-2 py-1 border-t border-black/5">
          <span
            className="text-sm font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            20
          </span>
          <span className="opacity-20 text-xs">|</span>
          <div className="flex flex-col items-center">
            <span className="text-[7px] uppercase tracking-wider">
              Setembro
            </span>
            <span className="text-[6px] opacity-50">2025</span>
          </div>
          <span className="opacity-20 text-xs">|</span>
          <span className="text-[7px] opacity-70">Sábado · 17:00</span>
        </div>
      </div>
    ),
  },
  {
    value: "minimal-line",
    label: "Linha Minimalista",
    description: "Todos os dados numa linha elegante sem fundo",
    preview: (
      <div className="flex flex-col items-center gap-1.5 py-2">
        <div className="text-[9px] tracking-widest opacity-60 uppercase">
          Save the Date
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-xl font-light leading-none"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            20
          </span>
          <span className="opacity-30 text-sm">·</span>
          <span className="text-[8px] uppercase tracking-[0.15em] opacity-70">
            Set
          </span>
          <span className="opacity-30 text-sm">·</span>
          <span className="text-[10px] font-light opacity-50">2025</span>
        </div>
        <div className="h-px w-12 bg-current opacity-20" />
        <span className="text-[7px] uppercase tracking-[0.2em] opacity-50">
          Sábado · 17:00
        </span>
      </div>
    ),
  },
];

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

const SCHEDULE_STYLE_OPTIONS: { value: ScheduleStyle; label: string }[] = [
  { value: "default", label: "Padrão" },
  { value: "illustrated", label: "Ilustrado" },
];

const SCHEDULE_ICON_OPTIONS: { value: ScheduleIcon; label: string }[] = [
  { value: "neutral", label: "Neutro (relógio)" },
  { value: "rings", label: "Alianças" },
  { value: "church", label: "Igreja" },
  { value: "cross", label: "Cruz" },
  { value: "heart", label: "Coração" },
  { value: "heart-handshake", label: "Aperto de mãos" },
  { value: "toast", label: "Brinde" },
  { value: "dinner", label: "Jantar" },
  { value: "cake", label: "Bolo" },
  { value: "coffee", label: "Café" },
  { value: "dance", label: "Dança" },
  { value: "music", label: "Música" },
  { value: "party", label: "Festa" },
  { value: "sparkles", label: "Brilho" },
  { value: "gift", label: "Presente" },
  { value: "flower", label: "Flor" },
  { value: "bouquet", label: "Buquê" },
  { value: "car", label: "Carro" },
  { value: "camera", label: "Foto" },
  { value: "sunset", label: "Pôr do sol" },
  { value: "bell", label: "Sino" },
  { value: "bird", label: "Pomba" },
  { value: "map", label: "Mapa" },
  { value: "custom", label: "Personalizado (SVG)" },
];

const DEFAULT_HERO_HEIGHT = 300;
const MIN_HERO_HEIGHT = 200;
const MAX_HERO_HEIGHT = 700;
const HERO_HEIGHT_STEP = 10;

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

function getDefaultFormState(firstTheme?: TemplateTheme): InvitationData {
  return {
    slug: "",
    themeId: firstTheme?.id ?? "theme_pink_floral",
    template: firstTheme?.name ?? "pink-floral",
    couple: { bride: "", groom: "", monogram: "" },
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
    location: {
      name: "",
      address: "",
      googleMapsUrl: "",
      wazeUrl: "",
      latitude: undefined,
      longitude: undefined,
      imageUrl: "",
    },
    rsvp: {
      enabled: true,
      deadline: "",
      showEmail: false,
      showDietaryRestrictions: true,
    },
    schedule: [],
    scheduleStyle: "default",
    dressCode: { enabled: false, text: "" },
    giftRegistry: { enabled: false, text: "", link: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "",
    heroHeight: DEFAULT_HERO_HEIGHT,
    videoUrl: "",
    videoPoster: "",
    faqs: [],
    guestGuide: { enabled: false, items: [] },
    envelope: {},
    saveDateStyle: "classic",
    cinematicImageUrl: "",
    sectionImages: {},
    parents: {
      enabled: false,
      blessingMessage: "Com a bênção dos Pais",
      inviteMessage: "Convidam para celebração do seu casamento",
      bridesFather: "",
      bridesMother: "",
      groomsFather: "",
      groomsMother: "",
    },
    ourStory: {
      enabled: false,
      title: "Nossa História",
      description: "",
    },
    invitationType: "standard",
    externalLink: "",
    isDemo: false,
    imageSettings: {},
    guestManagementEnabled: false,
    guestMessageTemplate: DEFAULT_GUEST_MESSAGE_TEMPLATE,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InvitationFormProps {
  initialData?: InvitationData & { id?: string };
  mode: "create" | "edit";
  invitationId?: string;
  ownerUrl?: string;
  /** All available themes (fetched by the server parent and passed down). */
  themes: TemplateTheme[];
}

export default function InvitationForm({
  initialData,
  mode,
  invitationId,
  ownerUrl,
  themes,
}: InvitationFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InvitationData>(
    initialData ?? getDefaultFormState(themes[0]),
  );
  const isWedding = isWeddingEventType(form.eventType);
  const hasRequiredNames = Boolean(
    form.couple.bride && (!isWedding || form.couple.groom),
  );
  const resolvedSocialPreview = resolveInvitationSocialPreview(
    form,
    typeof window !== "undefined" ? window.location.origin : "",
  );

  // Google Maps link auto-fill state
  const [mapsLink1, setMapsLink1] = useState("");
  const [mapsLink2, setMapsLink2] = useState("");
  const [resolvingLoc1, setResolvingLoc1] = useState(false);
  const [resolvingLoc2, setResolvingLoc2] = useState(false);

  /**
   * Resolve a Google Maps link and auto-fill location fields.
   * @param link - The Google Maps link (short or full)
   * @param target - Which location to fill ("location" or "location2")
   */
  const resolveLocationFromLink = useCallback(
    async (link: string, target: "location" | "location2") => {
      const trimmed = link.trim();
      if (!trimmed) {
        toast.error("Cole um link do Google Maps primeiro.");
        return;
      }

      const setResolving =
        target === "location" ? setResolvingLoc1 : setResolvingLoc2;
      setResolving(true);

      try {
        const res = await fetch("/api/admin/resolve-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erro ao resolver o link.");
          return;
        }

        // Auto-fill location fields (preserve imageUrl since it's uploaded separately)
        setForm((prev) => {
          const existing =
            target === "location" ? prev.location : prev.location2;
          const updated: LocationInfo = {
            name: data.name || existing?.name || "",
            address: data.address || existing?.address || "",
            googleMapsUrl: data.googleMapsUrl || existing?.googleMapsUrl || "",
            wazeUrl: data.wazeUrl || existing?.wazeUrl || "",
            latitude: data.latitude ?? existing?.latitude,
            longitude: data.longitude ?? existing?.longitude,
            imageUrl: existing?.imageUrl || "",
          };
          return { ...prev, [target]: updated };
        });

        toast.success("Localização preenchida com sucesso!");
      } catch {
        toast.error("Erro de rede ao resolver o link. Tente novamente.");
      } finally {
        setResolving(false);
      }
    },
    [],
  );

  // Generic updater
  const update = useCallback(
    <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Nested updaters
  const updateCouple = useCallback(
    (field: keyof InvitationData["couple"], value: string) => {
      setForm((prev) => {
        const couple = { ...prev.couple, [field]: value };
        // Auto-derive monogram
        if (field === "bride" || field === "groom") {
          couple.monogram = buildInvitationMonogram({
            eventType: prev.eventType,
            primaryName: field === "bride" ? value : prev.couple.bride,
            secondaryName: field === "groom" ? value : prev.couple.groom,
          });
        }
        // Auto-derive slug when creating
        if (mode === "create" && (field === "bride" || field === "groom")) {
          const slug = buildInvitationSlug({
            eventType: prev.eventType,
            primaryName: field === "bride" ? value : prev.couple.bride,
            secondaryName: field === "groom" ? value : prev.couple.groom,
          });
          return { ...prev, couple, slug };
        }
        return { ...prev, couple };
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

  const updateDate = useCallback(
    (field: keyof InvitationData["date"], value: string) => {
      setForm((prev) => {
        const date = { ...prev.date, [field]: value };
        // Auto-derive date fields when ISO changes
        if (field === "iso") {
          const derived = deriveDateFields(value);
          Object.assign(date, derived);
        }
        return { ...prev, date };
      });
    },
    [],
  );

  const updateLocation = useCallback(
    (
      field: keyof InvitationData["location"],
      value: string | number | undefined,
    ) => {
      setForm((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
    },
    [],
  );

  const updateLocation2 = useCallback(
    (
      field: keyof InvitationData["location"],
      value: string | number | undefined,
    ) => {
      setForm((prev) => ({
        ...prev,
        location2: { ...prev.location2!, [field]: value },
      }));
    },
    [],
  );

  const addLocation2 = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      location2: {
        name: "",
        address: "",
        googleMapsUrl: "",
        wazeUrl: "",
        latitude: undefined,
        longitude: undefined,
        imageUrl: "",
      },
    }));
  }, []);

  const removeLocation2 = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      location2: undefined,
    }));
  }, []);

  const updateRsvp = useCallback(
    (field: keyof InvitationData["rsvp"], value: boolean | string) => {
      setForm((prev) => ({
        ...prev,
        rsvp: { ...prev.rsvp, [field]: value },
      }));
    },
    [],
  );

  const updateDressCode = useCallback(
    (
      field: keyof InvitationData["dressCode"],
      value: boolean | string | string[],
    ) => {
      setForm((prev) => ({
        ...prev,
        dressCode: { ...prev.dressCode, [field]: value },
      }));
    },
    [],
  );

  const updateGiftRegistry = useCallback(
    (field: keyof InvitationData["giftRegistry"], value: boolean | string) => {
      setForm((prev) => ({
        ...prev,
        giftRegistry: { ...prev.giftRegistry, [field]: value },
      }));
    },
    [],
  );

  const updateAudio = useCallback(
    (field: keyof InvitationData["audio"], value: boolean | string) => {
      setForm((prev) => ({
        ...prev,
        audio: { ...prev.audio, [field]: value },
      }));
    },
    [],
  );

  // Schedule management
  const addScheduleItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        { time: "", label: "", venue: "", icon: "neutral" },
      ],
    }));
  }, []);

  const updateScheduleItem = useCallback(
    <K extends keyof InvitationData["schedule"][number]>(
      index: number,
      field: K,
      value: InvitationData["schedule"][number][K],
    ) => {
      setForm((prev) => ({
        ...prev,
        schedule: prev.schedule.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      }));
    },
    [],
  );

  const removeScheduleItem = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  }, []);

  // FAQ management
  const addFaq = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      faqs: [...(prev.faqs ?? []), { question: "", answer: "" }],
    }));
  }, []);

  const updateFaq = useCallback(
    (index: number, field: string, value: string) => {
      setForm((prev) => ({
        ...prev,
        faqs: (prev.faqs ?? []).map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      }));
    },
    [],
  );

  const removeFaq = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      faqs: (prev.faqs ?? []).filter((_, i) => i !== index),
    }));
  }, []);

  // Guest Guide management
  const updateGuestGuideEnabled = useCallback((enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      guestGuide: { ...(prev.guestGuide ?? { items: [] }), enabled },
    }));
  }, []);

  const togglePredefinedItem = useCallback((item: GuestGuideItem) => {
    setForm((prev) => {
      const current = prev.guestGuide?.items ?? [];
      const exists = current.some((i) => i.id === item.id);
      const items = exists
        ? current.filter((i) => i.id !== item.id)
        : [...current, item];
      return {
        ...prev,
        guestGuide: { enabled: prev.guestGuide?.enabled ?? true, items },
      };
    });
  }, []);

  const addCustomGuideItem = useCallback(() => {
    const newItem: GuestGuideItem = {
      id: `custom-${Date.now()}`,
      label: "",
      iconType: "lucide",
      iconName: "Star",
    };
    setForm((prev) => ({
      ...prev,
      guestGuide: {
        enabled: prev.guestGuide?.enabled ?? true,
        items: [...(prev.guestGuide?.items ?? []), newItem],
      },
    }));
  }, []);

  const updateCustomGuideItem = useCallback(
    (id: string, patch: Partial<GuestGuideItem>) => {
      setForm((prev) => ({
        ...prev,
        guestGuide: {
          enabled: prev.guestGuide?.enabled ?? true,
          items: (prev.guestGuide?.items ?? []).map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        },
      }));
    },
    [],
  );

  const removeGuideItem = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      guestGuide: {
        enabled: prev.guestGuide?.enabled ?? true,
        items: (prev.guestGuide?.items ?? []).filter((item) => item.id !== id),
      },
    }));
  }, []);

  const reorderGuideItem = useCallback(
    (id: string, direction: "up" | "down") => {
      setForm((prev) => {
        const items = [...(prev.guestGuide?.items ?? [])];
        const index = items.findIndex((i) => i.id === id);
        if (index < 0) return prev;
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= items.length) return prev;
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
        return {
          ...prev,
          guestGuide: { enabled: prev.guestGuide?.enabled ?? true, items },
        };
      });
    },
    [],
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

  // Section image overrides
  const updateSectionImage = useCallback(
    (field: keyof SectionImages, value: string | undefined) => {
      setForm((prev) => ({
        ...prev,
        sectionImages: { ...prev.sectionImages, [field]: value },
      }));
    },
    [],
  );

  // Image position/zoom settings
  const updateImageSettings = useCallback(
    (key: ImageSettingsKey, settings: ImageSettings) => {
      setForm((prev) => ({
        ...prev,
        imageSettings: { ...prev.imageSettings, [key]: settings },
      }));
    },
    [],
  );

  /** Read the current settings for a given image key, falling back to defaults. */
  const imgSettings = useCallback(
    (key: ImageSettingsKey): ImageSettings =>
      form.imageSettings?.[key] ?? DEFAULT_IMAGE_SETTINGS,
    [form.imageSettings],
  );

  // Parents info
  const updateParents = useCallback(
    (field: keyof ParentsInfo, value: string | boolean) => {
      setForm((prev) => ({
        ...prev,
        parents: {
          enabled: false,
          blessingMessage: "Com a bênção dos Pais",
          inviteMessage: "Convidam para celebração do seu casamento",
          bridesFather: "",
          bridesMother: "",
          groomsFather: "",
          groomsMother: "",
          ...prev.parents,
          [field]: value,
        },
      }));
    },
    [],
  );

  // Text style overrides — element-specific
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

  const clearTextStyles = useCallback(() => {
    setForm((prev) => ({ ...prev, textStyles: undefined }));
  }, []);

  // Text style overrides — font role (sectionTitle font)
  const updateTextStyleFont = useCallback(
    (role: keyof NonNullable<TextStyleOverrides["fonts"]>, value: string) => {
      setForm((prev) => {
        const ts = prev.textStyles ?? {};
        const fonts = { ...ts.fonts, [role]: value || undefined };
        const hasAny = Object.values(fonts).some((v) => v !== undefined);
        return {
          ...prev,
          textStyles: { ...ts, fonts: hasAny ? fonts : undefined },
        };
      });
    },
    [],
  );

  // Card style overrides per section
  const updateCardStyle = useCallback(
    (
      section: CardSectionKey,
      field: keyof CardStyle,
      value: string | number | undefined,
    ) => {
      setForm((prev) => {
        const cs = { ...prev.cardStyles };
        const sec = { ...cs[section], [field]: value || undefined };
        const secHasAny = Object.values(sec).some((v) => v !== undefined);
        cs[section] = secHasAny ? sec : undefined;
        const hasAny = Object.values(cs).some(Boolean);
        return {
          ...prev,
          cardStyles: hasAny ? cs : undefined,
        };
      });
    },
    [],
  );

  const clearCardStyles = useCallback(() => {
    setForm((prev) => ({ ...prev, cardStyles: undefined }));
  }, []);

  // -- Custom Texts --
  const updateCustomText = useCallback(
    (key: keyof CustomTexts, value: string) => {
      setForm((prev) => {
        const ct = { ...prev.customTexts };
        if (value.trim()) {
          ct[key] = value;
        } else {
          delete ct[key];
        }
        const hasAny = Object.keys(ct).length > 0;
        return { ...prev, customTexts: hasAny ? ct : undefined };
      });
    },
    [],
  );

  const clearCustomTexts = useCallback(() => {
    setForm((prev) => ({ ...prev, customTexts: undefined }));
  }, []);

  // Current theme for preview — merge per-invitation envelope overrides
  const currentTheme = useMemo(() => {
    const base =
      themes.find((t) => t.name === form.template) ??
      themes.find((t) => t.name === "pink-floral") ??
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
  }, [themes, form.template, form.envelope]);

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
        mode === "create" ? "Convite criado!" : "Convite atualizado!",
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
      {/* ──────────── Left: Form (55%) ──────────── */}
      <div className="w-full min-w-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4 pb-6">
            {/* Page title */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "create" ? "Novo Convite" : "Editar Convite"}
              </h1>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving
                  ? "A guardar..."
                  : mode === "create"
                    ? "Criar"
                    : "Guardar Alterações"}
              </Button>
            </div>

            {/* Owner link — only shown in edit mode */}
            {mode === "edit" && ownerUrl && (
              <OwnerLinkPanel ownerUrl={ownerUrl} />
            )}

            <Accordion defaultValue={[]} className="space-y-2">
              {/* ── Couple ── */}
              <AccordionItem value="couple" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  {isWedding ? "Casal" : "Pessoa / Evento"}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="eventType">Tipo de convite</Label>
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
                      <Label htmlFor="bride">
                        {isWedding ? "Noiva" : "Nome"}
                      </Label>
                      <Input
                        id="bride"
                        value={form.couple.bride}
                        onChange={(e) => updateCouple("bride", e.target.value)}
                        placeholder={isWedding ? "e.g. Maria" : "e.g. Sofia"}
                      />
                    </div>
                    {isWedding && (
                      <div className="space-y-1.5">
                        <Label htmlFor="groom">Noivo</Label>
                        <Input
                          id="groom"
                          value={form.couple.groom}
                          onChange={(e) =>
                            updateCouple("groom", e.target.value)
                          }
                          placeholder="e.g. João"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="monogram">Monograma</Label>
                      <Input
                        id="monogram"
                        value={form.couple.monogram}
                        onChange={(e) =>
                          updateCouple("monogram", e.target.value)
                        }
                        placeholder="Derivado automaticamente (ex: M&J)"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <Input
                        id="slug"
                        value={form.slug}
                        onChange={(e) => update("slug", e.target.value)}
                        placeholder="maria-joao"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="isDemo">Convite de demonstração</Label>
                      <p className="text-xs text-muted-foreground">
                        Marca este convite como demo apenas na área admin.
                      </p>
                    </div>
                    <Switch
                      id="isDemo"
                      checked={form.isDemo === true}
                      onCheckedChange={(checked) => update("isDemo", checked)}
                    />
                  </div>

                  <LandingMetadataFieldset
                    value={{
                      priceFromCents: form.priceFromCents ?? null,
                      currency: form.currency ?? "EUR",
                      landingModelName: form.landingModelName ?? null,
                      landingImageUrl: form.landingImageUrl ?? null,
                      landingDescription: form.landingDescription ?? null,
                    }}
                    onChange={(next) => {
                      update("priceFromCents", next.priceFromCents);
                      update("currency", next.currency);
                      update("landingModelName", next.landingModelName);
                      update("landingImageUrl", next.landingImageUrl);
                      update("landingDescription", next.landingDescription);
                    }}
                  />

                  <Separator />

                  {/* Parents mode */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Modo Pais</Label>
                        <p className="text-xs text-muted-foreground">
                          Exibe os nomes dos pais e mensagens de bênção no hero
                          do convite
                        </p>
                      </div>
                      <Switch
                        checked={form.parents?.enabled ?? false}
                        onCheckedChange={(v) => updateParents("enabled", v)}
                      />
                    </div>

                    {form.parents?.enabled && (
                      <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                        <div className="space-y-1.5">
                          <Label htmlFor="blessingMessage">
                            Mensagem de bênção
                          </Label>
                          <Input
                            id="blessingMessage"
                            value={form.parents?.blessingMessage ?? ""}
                            onChange={(e) =>
                              updateParents("blessingMessage", e.target.value)
                            }
                            placeholder="Com a bênção dos Pais"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                            Pais da Noiva
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={form.parents?.bridesFather ?? ""}
                              onChange={(e) =>
                                updateParents("bridesFather", e.target.value)
                              }
                              placeholder="Pai da noiva"
                            />
                            <Input
                              value={form.parents?.bridesMother ?? ""}
                              onChange={(e) =>
                                updateParents("bridesMother", e.target.value)
                              }
                              placeholder="Mãe da noiva"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                            Pais do Noivo
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={form.parents?.groomsFather ?? ""}
                              onChange={(e) =>
                                updateParents("groomsFather", e.target.value)
                              }
                              placeholder="Pai do noivo"
                            />
                            <Input
                              value={form.parents?.groomsMother ?? ""}
                              onChange={(e) =>
                                updateParents("groomsMother", e.target.value)
                              }
                              placeholder="Mãe do noivo"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="inviteMessage">
                            Mensagem de convite
                          </Label>
                          <Textarea
                            id="inviteMessage"
                            value={form.parents?.inviteMessage ?? ""}
                            onChange={(e) =>
                              updateParents("inviteMessage", e.target.value)
                            }
                            placeholder="Convidam para celebração do seu casamento"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Envelope ── */}
              <AccordionItem
                value="envelope"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Envelope
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
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
                    {(form.envelope?.topFlap ?? "") && (
                      <ImagePositionEditor
                        src={form.envelope!.topFlap!}
                        settings={imgSettings("envelopeTopFlap")}
                        onChange={(s) =>
                          updateImageSettings("envelopeTopFlap", s)
                        }
                      />
                    )}
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
                    {(form.envelope?.bottomFlap ?? "") && (
                      <ImagePositionEditor
                        src={form.envelope!.bottomFlap!}
                        settings={imgSettings("envelopeBottomFlap")}
                        onChange={(s) =>
                          updateImageSettings("envelopeBottomFlap", s)
                        }
                      />
                    )}
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

              {/* ── Template ── */}
              <AccordionItem
                value="template"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Modelo & Mídia
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="space-y-1.5">
                    <Label>Modelo</Label>
                    <Select
                      value={form.template}
                      onValueChange={(v) => {
                        if (!v) return;
                        const selected = themes.find((t) => t.name === v);
                        setForm((prev) => ({
                          ...prev,
                          template: v,
                          themeId: selected?.id ?? v,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map((t) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Imagem Principal</Label>
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
                        onChange={(s) => updateImageSettings("heroImage", s)}
                      />
                    )}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="heroHeight">Altura do hero</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {form.heroHeight ?? DEFAULT_HERO_HEIGHT}px
                        </span>
                      </div>
                      <input
                        id="heroHeight"
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
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vídeo (opcional)</Label>
                    <MediaUpload
                      kind="video"
                      maxSizeMB={100}
                      value={form.videoUrl || undefined}
                      onUpload={(url, meta) => {
                        update("videoUrl", url);
                        // Persist the auto-generated first-frame poster so
                        // public renderers can show it while the video
                        // loads. Falls back to undefined when extraction
                        // is unavailable.
                        update("videoPoster", meta?.posterUrl ?? undefined);
                      }}
                      onClear={() => {
                        update("videoUrl", undefined);
                        update("videoPoster", undefined);
                      }}
                    />
                  </div>

                  {/* ── Section Images ── */}
                  <div className="space-y-1.5">
                    <Label>
                      Imagem de Seção 1{" "}
                      <span className="text-muted-foreground font-normal">
                        (após capa)
                      </span>
                    </Label>
                    <MediaUpload
                      kind="image"
                      maxSizeMB={5}
                      value={form.sectionImages?.image1 || undefined}
                      onUpload={(url) => updateSectionImage("image1", url)}
                      onClear={() => updateSectionImage("image1", undefined)}
                    />
                    {form.sectionImages?.image1 && (
                      <ImagePositionEditor
                        src={form.sectionImages.image1}
                        settings={imgSettings("sectionImage1")}
                        onChange={(s) =>
                          updateImageSettings("sectionImage1", s)
                        }
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Imagem de Seção 2{" "}
                      <span className="text-muted-foreground font-normal">
                        (após programação)
                      </span>
                    </Label>
                    <MediaUpload
                      kind="image"
                      maxSizeMB={5}
                      value={form.sectionImages?.image2 || undefined}
                      onUpload={(url) => updateSectionImage("image2", url)}
                      onClear={() => updateSectionImage("image2", undefined)}
                    />
                    {form.sectionImages?.image2 && (
                      <ImagePositionEditor
                        src={form.sectionImages.image2}
                        settings={imgSettings("sectionImage2")}
                        onChange={(s) =>
                          updateImageSettings("sectionImage2", s)
                        }
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Imagem de Seção 3{" "}
                      <span className="text-muted-foreground font-normal">
                        (após localização)
                      </span>
                    </Label>
                    <MediaUpload
                      kind="image"
                      maxSizeMB={5}
                      value={form.sectionImages?.image3 || undefined}
                      onUpload={(url) => updateSectionImage("image3", url)}
                      onClear={() => updateSectionImage("image3", undefined)}
                    />
                    {form.sectionImages?.image3 && (
                      <ImagePositionEditor
                        src={form.sectionImages.image3}
                        settings={imgSettings("sectionImage3")}
                        onChange={(s) =>
                          updateImageSettings("sectionImage3", s)
                        }
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Imagem de Rodapé{" "}
                      <span className="text-muted-foreground font-normal">
                        (imagem 4)
                      </span>
                    </Label>
                    <MediaUpload
                      kind="image"
                      maxSizeMB={5}
                      value={form.sectionImages?.image4 || undefined}
                      onUpload={(url) => updateSectionImage("image4", url)}
                      onClear={() => updateSectionImage("image4", undefined)}
                    />
                    {form.sectionImages?.image4 && (
                      <ImagePositionEditor
                        src={form.sectionImages.image4}
                        settings={imgSettings("sectionImage4")}
                        onChange={(s) =>
                          updateImageSettings("sectionImage4", s)
                        }
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="quote">Citação</Label>
                    <Textarea
                      id="quote"
                      value={form.quote}
                      onChange={(e) => update("quote", e.target.value)}
                      rows={2}
                      placeholder="Uma citação romântica..."
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Date & Time ── */}
              <AccordionItem value="date" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  Data & Hora
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dateIso">Data (ISO)</Label>
                      <Input
                        id="dateIso"
                        type="date"
                        value={form.date.iso ? form.date.iso.split("T")[0] : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDate("iso", val ? `${val}T00:00:00.000Z` : "");
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="time">Hora</Label>
                      <Input
                        id="time"
                        value={form.date.time}
                        onChange={(e) => updateDate("time", e.target.value)}
                        placeholder="16:00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="display">Data de Exibição</Label>
                      <Input
                        id="display"
                        value={form.date.display}
                        onChange={(e) => updateDate("display", e.target.value)}
                        placeholder="Derivado automaticamente"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                      <Input
                        id="dayOfWeek"
                        value={form.date.dayOfWeek}
                        onChange={(e) =>
                          updateDate("dayOfWeek", e.target.value)
                        }
                        placeholder="Derivado automaticamente"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A data de exibição, dia da semana, dia, mês e ano são
                    derivados automaticamente ao selecionar uma data.
                  </p>

                  {/* ── Save the Date style picker ── */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-sm font-medium">
                      Estilo do Save the Date
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {SAVE_DATE_STYLE_OPTIONS.map((opt) => {
                        const isSelected =
                          (form.saveDateStyle ?? "classic") === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => update("saveDateStyle", opt.value)}
                            className="w-full text-left rounded-lg border transition-all duration-150 overflow-hidden"
                            style={{
                              borderColor: isSelected
                                ? "hsl(var(--primary))"
                                : "hsl(var(--border))",
                              boxShadow: isSelected
                                ? "0 0 0 2px hsl(var(--primary) / 0.15)"
                                : "none",
                              background: isSelected
                                ? "hsl(var(--primary) / 0.04)"
                                : "transparent",
                            }}
                          >
                            <div className="flex items-stretch gap-0">
                              {/* Mini preview pane */}
                              <div
                                className="flex items-center justify-center shrink-0 border-r"
                                style={{
                                  width: 120,
                                  minHeight: 72,
                                  borderColor: isSelected
                                    ? "hsl(var(--primary) / 0.2)"
                                    : "hsl(var(--border))",
                                  background: isSelected
                                    ? "hsl(var(--primary) / 0.06)"
                                    : "hsl(var(--muted) / 0.5)",
                                  color: "hsl(var(--foreground))",
                                  fontSize: 12,
                                }}
                              >
                                {opt.preview}
                              </div>
                              {/* Text info */}
                              <div className="flex flex-col justify-center px-3 py-2 gap-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium leading-none">
                                    {opt.label}
                                  </span>
                                  {isSelected && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                                      Selecionado
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {opt.description}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Cinematic image upload — shown only when cinematic is selected ── */}
                  {(form.saveDateStyle ?? "classic") === "cinematic" && (
                    <div className="space-y-2 pt-1 rounded-lg border border-dashed border-border p-3">
                      <Label className="text-sm font-medium">
                        Imagem de Fundo (Cinemático)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Fotografia para o topo do cartão cinemático. Se não
                        carregar uma imagem, será usada uma foto de casamento
                        padrão.
                      </p>
                      <MediaUpload
                        kind="image"
                        maxSizeMB={8}
                        value={form.cinematicImageUrl || undefined}
                        onUpload={(url) => update("cinematicImageUrl", url)}
                        onClear={() => update("cinematicImageUrl", "")}
                      />
                      {form.cinematicImageUrl && (
                        <ImagePositionEditor
                          src={form.cinematicImageUrl}
                          settings={imgSettings("cinematicImage")}
                          onChange={(s) =>
                            updateImageSettings("cinematicImage", s)
                          }
                        />
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* ── Location ── */}
              <AccordionItem
                value="location"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Localização
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {/* ── Auto-fill from Google Maps link ── */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Preencher automaticamente via Google Maps
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={mapsLink1}
                        onChange={(e) => setMapsLink1(e.target.value)}
                        placeholder="Cole o link do Google Maps aqui..."
                        className="flex-1 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            resolveLocationFromLink(mapsLink1, "location");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={resolvingLoc1 || !mapsLink1.trim()}
                        onClick={() =>
                          resolveLocationFromLink(mapsLink1, "location")
                        }
                        className="shrink-0"
                      >
                        {resolvingLoc1 ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        <span className="ml-1.5">
                          {resolvingLoc1 ? "A buscar..." : "Buscar"}
                        </span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <Label htmlFor="locName">Nome do Local</Label>
                    <Input
                      id="locName"
                      value={form.location.name}
                      onChange={(e) => updateLocation("name", e.target.value)}
                      placeholder="e.g. Quinta da Serra"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="locAddress">Morada</Label>
                    <Input
                      id="locAddress"
                      value={form.location.address}
                      onChange={(e) =>
                        updateLocation("address", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="gmaps">URL Google Maps</Label>
                      <Input
                        id="gmaps"
                        value={form.location.googleMapsUrl}
                        onChange={(e) =>
                          updateLocation("googleMapsUrl", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="waze">URL Waze (opcional)</Label>
                      <Input
                        id="waze"
                        value={form.location.wazeUrl ?? ""}
                        onChange={(e) =>
                          updateLocation("wazeUrl", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={form.location.latitude ?? ""}
                        onChange={(e) =>
                          updateLocation(
                            "latitude",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={form.location.longitude ?? ""}
                        onChange={(e) =>
                          updateLocation(
                            "longitude",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mapZoom">Zoom do Mapa</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {form.location.mapZoom ?? 17}
                      </span>
                    </div>
                    <input
                      id="mapZoom"
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={form.location.mapZoom ?? 17}
                      onChange={(e) =>
                        updateLocation("mapZoom", parseInt(e.target.value, 10))
                      }
                      className="w-full accent-foreground cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Imagem do Local</Label>
                    <MediaUpload
                      kind="image"
                      maxSizeMB={5}
                      value={form.location.imageUrl || undefined}
                      onUpload={(url) => updateLocation("imageUrl", url)}
                      onClear={() => updateLocation("imageUrl", "")}
                    />
                    {form.location.imageUrl && (
                      <ImagePositionEditor
                        src={form.location.imageUrl}
                        settings={imgSettings("locationImage1")}
                        onChange={(s) =>
                          updateImageSettings("locationImage1", s)
                        }
                      />
                    )}
                  </div>

                  {/* ── Second Location (optional) ── */}
                  <Separator className="my-4" />
                  {!form.location2 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={addLocation2}
                    >
                      + Adicionar Segundo Local
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          Segundo Local
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={removeLocation2}
                        >
                          Remover
                        </Button>
                      </div>

                      {/* ── Auto-fill from Google Maps link (Location 2) ── */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Preencher automaticamente via Google Maps
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={mapsLink2}
                            onChange={(e) => setMapsLink2(e.target.value)}
                            placeholder="Cole o link do Google Maps aqui..."
                            className="flex-1 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                resolveLocationFromLink(mapsLink2, "location2");
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={resolvingLoc2 || !mapsLink2.trim()}
                            onClick={() =>
                              resolveLocationFromLink(mapsLink2, "location2")
                            }
                            className="shrink-0"
                          >
                            {resolvingLoc2 ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MapPin className="h-4 w-4" />
                            )}
                            <span className="ml-1.5">
                              {resolvingLoc2 ? "A buscar..." : "Buscar"}
                            </span>
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1.5">
                        <Label htmlFor="loc2Name">Nome do Local</Label>
                        <Input
                          id="loc2Name"
                          value={form.location2.name}
                          onChange={(e) =>
                            updateLocation2("name", e.target.value)
                          }
                          placeholder="e.g. Quinta da Serra"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="loc2Address">Morada</Label>
                        <Input
                          id="loc2Address"
                          value={form.location2.address}
                          onChange={(e) =>
                            updateLocation2("address", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="gmaps2">URL Google Maps</Label>
                          <Input
                            id="gmaps2"
                            value={form.location2.googleMapsUrl}
                            onChange={(e) =>
                              updateLocation2("googleMapsUrl", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="waze2">URL Waze (opcional)</Label>
                          <Input
                            id="waze2"
                            value={form.location2.wazeUrl ?? ""}
                            onChange={(e) =>
                              updateLocation2("wazeUrl", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="lat2">Latitude</Label>
                          <Input
                            id="lat2"
                            type="number"
                            step="any"
                            value={form.location2.latitude ?? ""}
                            onChange={(e) =>
                              updateLocation2(
                                "latitude",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lng2">Longitude</Label>
                          <Input
                            id="lng2"
                            type="number"
                            step="any"
                            value={form.location2.longitude ?? ""}
                            onChange={(e) =>
                              updateLocation2(
                                "longitude",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="mapZoom2">Zoom do Mapa</Label>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {form.location2.mapZoom ?? 17}
                          </span>
                        </div>
                        <input
                          id="mapZoom2"
                          type="range"
                          min={1}
                          max={20}
                          step={1}
                          value={form.location2.mapZoom ?? 17}
                          onChange={(e) =>
                            updateLocation2(
                              "mapZoom",
                              parseInt(e.target.value, 10),
                            )
                          }
                          className="w-full accent-foreground cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Imagem do Local</Label>
                        <MediaUpload
                          kind="image"
                          maxSizeMB={5}
                          value={form.location2.imageUrl || undefined}
                          onUpload={(url) => updateLocation2("imageUrl", url)}
                          onClear={() => updateLocation2("imageUrl", "")}
                        />
                        {form.location2.imageUrl && (
                          <ImagePositionEditor
                            src={form.location2.imageUrl}
                            settings={imgSettings("locationImage2")}
                            onChange={(s) =>
                              updateImageSettings("locationImage2", s)
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* ── Details ── */}
              <AccordionItem value="details" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  Detalhes & Opções
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Dress Code */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Dress Code Ativado</Label>
                      <Switch
                        checked={form.dressCode.enabled}
                        onCheckedChange={(v) => updateDressCode("enabled", v)}
                      />
                    </div>
                    {form.dressCode.enabled && (
                      <div className="space-y-1.5">
                        <Label htmlFor="dressCode">Código de Vestuário</Label>
                        <Textarea
                          id="dressCode"
                          value={form.dressCode.text}
                          onChange={(e) =>
                            updateDressCode("text", e.target.value)
                          }
                          placeholder="e.g. Traje Formal"
                        />
                      </div>
                    )}
                    {form.dressCode.enabled && (
                      <div className="space-y-1.5">
                        <Label>Paleta de Cores</Label>
                        <div className="flex flex-wrap items-center gap-2">
                          {(form.dressCode.colors ?? []).map((color, idx) => (
                            <div key={idx} className="group relative">
                              <label
                                className="block h-8 w-8 cursor-pointer rounded-full border border-border shadow-sm transition-shadow hover:shadow-md"
                                style={{ backgroundColor: color }}
                              >
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) => {
                                    const updated = [
                                      ...(form.dressCode.colors ?? []),
                                    ];
                                    updated[idx] = e.target.value;
                                    updateDressCode("colors", updated);
                                  }}
                                  className="sr-only"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (
                                    form.dressCode.colors ?? []
                                  ).filter((_, i) => i !== idx);
                                  updateDressCode(
                                    "colors",
                                    updated.length > 0 ? updated : [],
                                  );
                                }}
                                className="absolute -top-1.5 -right-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm group-hover:flex"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                          {(form.dressCode.colors ?? []).length < 6 && (
                            <button
                              type="button"
                              onClick={() => {
                                const current = form.dressCode.colors ?? [];
                                updateDressCode("colors", [
                                  ...current,
                                  "#000000",
                                ]);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Adicione até 6 cores para exibir no convite.
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* RSVP */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Confirmação Ativada</Label>
                      <Switch
                        checked={form.rsvp.enabled}
                        onCheckedChange={(v) => updateRsvp("enabled", v)}
                      />
                    </div>
                    {form.rsvp.enabled && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="rsvpDeadline">Prazo (opcional)</Label>
                          <Input
                            id="rsvpDeadline"
                            value={form.rsvp.deadline ?? ""}
                            onChange={(e) =>
                              updateRsvp("deadline", e.target.value)
                            }
                            placeholder="e.g. 15 de Agosto de 2026"
                          />
                        </div>
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
                            checked={
                              form.rsvp.showDietaryRestrictions !== false
                            }
                            onCheckedChange={(v) =>
                              updateRsvp("showDietaryRestrictions", v)
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Gift Registry */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Lista de Presentes Ativada</Label>
                      <Switch
                        checked={form.giftRegistry.enabled}
                        onCheckedChange={(v) =>
                          updateGiftRegistry("enabled", v)
                        }
                      />
                    </div>
                    {form.giftRegistry.enabled && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="giftText">
                            Texto da Lista de Presentes
                          </Label>
                          <Textarea
                            id="giftText"
                            value={form.giftRegistry.text}
                            onChange={(e) =>
                              updateGiftRegistry("text", e.target.value)
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="giftLink">
                            Link da Lista de Presentes (opcional)
                          </Label>
                          <Input
                            id="giftLink"
                            value={form.giftRegistry.link ?? ""}
                            onChange={(e) =>
                              updateGiftRegistry("link", e.target.value)
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Audio */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Áudio Ativado</Label>
                      <Switch
                        checked={form.audio.enabled}
                        onCheckedChange={(v) => updateAudio("enabled", v)}
                      />
                    </div>
                    {form.audio.enabled && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Ficheiro de Áudio</Label>
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
                            <Label htmlFor="audioArtist">Artista</Label>
                            <Input
                              id="audioArtist"
                              value={form.audio.artist}
                              onChange={(e) =>
                                updateAudio("artist", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="audioTitle">Título</Label>
                            <Input
                              id="audioTitle"
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
                </AccordionContent>
              </AccordionItem>

              {/* ── Nossa História ── */}
              <AccordionItem
                value="ourStory"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Nossa História{" "}
                  {form.ourStory?.enabled ? "(ativo)" : "(desativado)"}
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={form.ourStory?.enabled ?? false}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          ourStory: {
                            ...(prev.ourStory ?? {
                              enabled: false,
                              title: "Nossa História",
                              description: "",
                            }),
                            enabled: checked,
                          },
                        }))
                      }
                    />
                    <Label className="text-xs text-muted-foreground">
                      Mostrar secção &quot;Nossa História&quot;
                    </Label>
                  </div>

                  {form.ourStory?.enabled && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Título</Label>
                        <Input
                          value={form.ourStory?.title ?? "Nossa História"}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              ourStory: {
                                ...(prev.ourStory ?? {
                                  enabled: true,
                                  title: "Nossa História",
                                  description: "",
                                }),
                                title: e.target.value,
                              },
                            }))
                          }
                          placeholder="Nossa História"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Textarea
                          value={form.ourStory?.description ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              ourStory: {
                                ...(prev.ourStory ?? {
                                  enabled: true,
                                  title: "Nossa História",
                                  description: "",
                                }),
                                description: e.target.value,
                              },
                            }))
                          }
                          placeholder="Conte a história do casal..."
                          rows={5}
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* ── Schedule ── */}
              <AccordionItem
                value="schedule"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Programa ({form.schedule.length} eventos)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Layout do programa</Label>
                    <Select
                      value={form.scheduleStyle ?? "default"}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          scheduleStyle: value as ScheduleStyle,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar layout" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_STYLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.scheduleStyle === "illustrated" && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Cor dos ícones e conectores
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          className="h-9 w-12 cursor-pointer p-1"
                          value={colorPickerValue(
                            form.cardStyles?.schedule?.accentColor,
                            "#c2410c",
                          )}
                          onChange={(e) =>
                            updateCardStyle(
                              "schedule",
                              "accentColor",
                              e.target.value,
                            )
                          }
                        />
                        <Input
                          type="text"
                          placeholder="ex.: #c2410c (deixe vazio para usar o tema)"
                          value={form.cardStyles?.schedule?.accentColor ?? ""}
                          onChange={(e) =>
                            updateCardStyle(
                              "schedule",
                              "accentColor",
                              e.target.value,
                            )
                          }
                        />
                        {form.cardStyles?.schedule?.accentColor && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateCardStyle(
                                "schedule",
                                "accentColor",
                                undefined,
                              )
                            }
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {form.schedule.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 gap-2 md:grid-cols-[0.9fr_1fr_1fr_1fr_auto] md:items-end"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">Hora</Label>
                        <Input
                          value={item.time}
                          onChange={(e) =>
                            updateScheduleItem(i, "time", e.target.value)
                          }
                          placeholder="16:00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            updateScheduleItem(i, "label", e.target.value)
                          }
                          placeholder="Cerimónia"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Local</Label>
                        <Input
                          value={item.venue}
                          onChange={(e) =>
                            updateScheduleItem(i, "venue", e.target.value)
                          }
                          placeholder="Capela"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ícone</Label>
                        <Select
                          value={item.icon ?? "neutral"}
                          onValueChange={(value) =>
                            updateScheduleItem(i, "icon", value as ScheduleIcon)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Ícone" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCHEDULE_ICON_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleItem(i)}
                        className="text-destructive"
                      >
                        &times;
                      </Button>
                      {item.icon === "custom" && (
                        <div className="space-y-1 md:col-span-5">
                          <Label className="text-xs">
                            SVG personalizado (cor herdada do tema)
                          </Label>
                          <MediaUpload
                            kind="svg"
                            maxSizeMB={1}
                            value={item.iconUrl}
                            onUpload={(url) =>
                              updateScheduleItem(i, "iconUrl", url)
                            }
                            onClear={() =>
                              updateScheduleItem(i, "iconUrl", undefined)
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addScheduleItem}>
                    + Adicionar Evento
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* ── FAQs ── */}
              <AccordionItem value="faqs" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  Perguntas Frequentes ({(form.faqs ?? []).length} itens)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {(form.faqs ?? []).map((faq, i) => (
                    <div key={i} className="space-y-2 border-l-2 pl-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Pergunta</Label>
                          <Input
                            value={faq.question}
                            onChange={(e) =>
                              updateFaq(i, "question", e.target.value)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFaq(i)}
                          className="text-destructive mt-5"
                        >
                          &times;
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Resposta</Label>
                        <Textarea
                          value={faq.answer}
                          onChange={(e) =>
                            updateFaq(i, "answer", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addFaq}>
                    + Adicionar Pergunta
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* ── Manual do Bom Convidado ── */}
              <GuestGuideFormSection
                guestGuide={form.guestGuide ?? { enabled: false, items: [] }}
                onEnabledChange={updateGuestGuideEnabled}
                onTogglePredefined={togglePredefinedItem}
                onAddCustom={addCustomGuideItem}
                onUpdateCustom={updateCustomGuideItem}
                onRemoveItem={removeGuideItem}
                onReorderItem={reorderGuideItem}
              />

              {/* ── Textos Personalizados ── */}
              <AccordionItem
                value="customTexts"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Textos Personalizados
                </AccordionTrigger>
                <AccordionContent className="space-y-5 pb-4">
                  <p className="text-xs text-muted-foreground">
                    Personalize os textos exibidos no convite. Deixe em branco
                    para usar o texto padrão.
                  </p>

                  {CUSTOM_TEXT_GROUPS.map((group) => (
                    <div key={group.id} className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </h4>
                      {group.fields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label
                            htmlFor={`ct-${field.key}`}
                            className="text-xs"
                          >
                            {field.label}
                          </Label>
                          <Input
                            id={`ct-${field.key}`}
                            value={form.customTexts?.[field.key] ?? ""}
                            onChange={(e) =>
                              updateCustomText(field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            className="text-sm"
                          />
                        </div>
                      ))}
                      <Separator />
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={clearCustomTexts}
                  >
                    <RotateCcw size={12} className="mr-1" />
                    Repor todos os textos padrão
                  </Button>
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

                  {form.guestManagementEnabled && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="guest-msg-template">
                          Mensagem de convite (template)
                        </Label>
                        <Textarea
                          id="guest-msg-template"
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
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Guarda o convite primeiro para gerir a lista de
                          convidados.
                        </p>
                      )}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

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

      {/* ──────────── Right: Live Preview (35%) ──────────── */}
      <div className="w-[35%] min-w-[380px] border-l flex flex-col h-full">
        <Tabs defaultValue="invite" className="flex flex-col h-full">
          {/* Tab bar */}
          <div className="px-4 pt-3 pb-0 border-b bg-muted/50 flex items-center justify-between gap-2 shrink-0">
            <TabsList className="h-8">
              <TabsTrigger value="envelope" className="text-xs px-3 h-7">
                Envelope
              </TabsTrigger>
              <TabsTrigger value="invite" className="text-xs px-3 h-7">
                Convite
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1">
              {form.textStyles && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={clearTextStyles}
                          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        />
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>Resetar estilos de texto</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {form.cardStyles && Object.keys(form.cardStyles).length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={clearCardStyles}
                          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        />
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>Resetar estilos dos cartões</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span className="text-xs text-muted-foreground shrink-0">
                {form.slug ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <a
                            href={`/${form.slug}`}
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
          </div>

          {/* ── Tab: Envelope preview ── */}
          <TabsContent value="envelope" className="flex-1 overflow-hidden m-0">
            <div className="h-full relative overflow-hidden bg-neutral-200 max-h-165">
              {hasRequiredNames ? (
                <EnvelopeCover
                  theme={currentTheme}
                  coverBackground={form.envelope?.coverBackground}
                  onOpen={() => {}}
                  monogram={form.couple.monogram}
                  shimmer={form.envelope?.shimmer !== false}
                  imageSettings={form.imageSettings}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
                  {isWedding
                    ? "Insira os nomes do casal para ver a pré-visualização"
                    : "Insira o nome para ver a pré-visualização"}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Invitation page preview ── */}
          <TabsContent
            value="invite"
            className="flex-1 overflow-auto m-0 bg-neutral-100"
          >
            <InlineTextEditProvider
              updateTextStyleElement={updateTextStyleElement}
              textStyles={form.textStyles}
            >
              <InlineCardEditProvider
                updateCardStyle={updateCardStyle}
                cardStyles={form.cardStyles}
              >
                <TextStyleToolbar />
                <CardStyleToolbar />
                <div className="mx-auto origin-top w-full max-h-165 relative">
                  {hasRequiredNames ? (
                    <InvitationPage
                      invitation={form}
                      theme={currentTheme}
                      isPreview
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
                      {isWedding
                        ? "Insira os nomes do casal para ver a pré-visualização"
                        : "Insira o nome para ver a pré-visualização"}
                    </div>
                  )}
                </div>
              </InlineCardEditProvider>
            </InlineTextEditProvider>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
