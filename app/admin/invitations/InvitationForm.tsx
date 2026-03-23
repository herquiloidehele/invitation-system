"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type {
  InvitationData,
  TemplateTheme,
  EnvelopeConfig,
  GuestGuideItem,
  SaveDateStyle,
} from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvitationPage from "@/components/shared/InvitationPage";
import EnvelopeCover from "@/components/shared/EnvelopeCover";
import MediaUpload from "@/components/admin/MediaUpload";
import GuestGuideFormSection from "@/components/admin/GuestGuideFormSection";
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
    return {
      day: String(d.getDate()).padStart(2, "0"),
      month: months[d.getMonth()],
      year: String(d.getFullYear()),
      dayOfWeek: days[d.getDay()],
      display: `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`,
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
    location: {
      name: "",
      address: "",
      googleMapsUrl: "",
      wazeUrl: "",
      latitude: undefined,
      longitude: undefined,
      imageUrl: "",
    },
    rsvp: { enabled: true, deadline: "" },
    schedule: [],
    dressCode: "",
    giftRegistry: { enabled: false, text: "", link: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "",
    videoUrl: "",
    faqs: [],
    guestGuide: { enabled: false, items: [] },
    envelope: {},
    saveDateStyle: "classic",
    cinematicImageUrl: "",
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
          couple.monogram = monogramFrom(
            field === "bride" ? value : prev.couple.bride,
            field === "groom" ? value : prev.couple.groom,
          );
        }
        // Auto-derive slug when creating
        if (mode === "create" && (field === "bride" || field === "groom")) {
          const slug = slugify(
            field === "bride" ? value : prev.couple.bride,
            field === "groom" ? value : prev.couple.groom,
          );
          return { ...prev, couple, slug };
        }
        return { ...prev, couple };
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

  const updateRsvp = useCallback(
    (field: keyof InvitationData["rsvp"], value: boolean | string) => {
      setForm((prev) => ({
        ...prev,
        rsvp: { ...prev.rsvp, [field]: value },
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
      schedule: [...prev.schedule, { time: "", label: "", venue: "" }],
    }));
  }, []);

  const updateScheduleItem = useCallback(
    (index: number, field: string, value: string) => {
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

  // Envelope overrides
  const updateEnvelope = useCallback(
    (field: keyof EnvelopeConfig, value: string) => {
      setForm((prev) => ({
        ...prev,
        envelope: { ...prev.envelope, [field]: value },
      }));
    },
    [],
  );

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
    if (!form.couple.bride || !form.couple.groom) {
      toast.error("Os nomes da noiva e do noivo são obrigatórios");
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
                  Casal
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="bride">Noiva</Label>
                      <Input
                        id="bride"
                        value={form.couple.bride}
                        onChange={(e) => updateCouple("bride", e.target.value)}
                        placeholder="e.g. Maria"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="groom">Noivo</Label>
                      <Input
                        id="groom"
                        value={form.couple.groom}
                        onChange={(e) => updateCouple("groom", e.target.value)}
                        placeholder="e.g. João"
                      />
                    </div>
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
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vídeo (opcional)</Label>
                    <MediaUpload
                      kind="video"
                      maxSizeMB={100}
                      value={form.videoUrl || undefined}
                      onUpload={(url) => update("videoUrl", url)}
                      onClear={() => update("videoUrl", undefined)}
                    />
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
                    <Label>Imagem do Local</Label>
                    <MediaUpload
                      kind="image"
                      maxSizeMB={5}
                      value={form.location.imageUrl || undefined}
                      onUpload={(url) => updateLocation("imageUrl", url)}
                      onClear={() => updateLocation("imageUrl", "")}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Details ── */}
              <AccordionItem value="details" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  Detalhes & Opções
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Dress Code */}
                  <div className="space-y-1.5">
                    <Label htmlFor="dressCode">Código de Vestuário</Label>
                    <Input
                      id="dressCode"
                      value={form.dressCode}
                      onChange={(e) => update("dressCode", e.target.value)}
                      placeholder="e.g. Traje Formal"
                    />
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

              {/* ── Schedule ── */}
              <AccordionItem
                value="schedule"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Programa ({form.schedule.length} eventos)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {form.schedule.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleItem(i)}
                        className="text-destructive"
                      >
                        &times;
                      </Button>
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
            <span className="text-xs text-muted-foreground shrink-0">
              {currentTheme.label}
            </span>
          </div>

          {/* ── Tab: Envelope preview ── */}
          <TabsContent value="envelope" className="flex-1 overflow-hidden m-0">
            <div className="h-full relative overflow-hidden bg-neutral-200 max-h-165">
              {form.couple.bride && form.couple.groom ? (
                <EnvelopeCover
                  theme={currentTheme}
                  onOpen={() => {}}
                  monogram={form.couple.monogram}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
                  Insira os nomes do casal para ver a pré-visualização
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Invitation page preview ── */}
          <TabsContent
            value="invite"
            className="flex-1 overflow-auto m-0 bg-neutral-100"
          >
            <div className="mx-auto origin-top w-full max-h-165 relative">
              {form.couple.bride && form.couple.groom ? (
                <InvitationPage
                  invitation={form}
                  theme={currentTheme}
                  isPreview
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
                  Insira os nomes do casal para ver a pré-visualização
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
