"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { InvitationData, TemplateName } from "@/lib/types";
import { themes } from "@/lib/themes";

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
import InvitationPage from "@/components/shared/InvitationPage";

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
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    const days = [
      "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
      "Quinta-feira", "Sexta-feira", "Sábado",
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
// Default form state
// ---------------------------------------------------------------------------

const TEMPLATE_OPTIONS: TemplateName[] = [
  "pink-floral",
  "modern-minimal",
  "boho-chic",
  "midnight-elegance",
];

function getDefaultFormState(): InvitationData {
  return {
    slug: "",
    template: "pink-floral",
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
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InvitationFormProps {
  initialData?: InvitationData & { id?: string };
  mode: "create" | "edit";
  invitationId?: string;
}

export default function InvitationForm({
  initialData,
  mode,
  invitationId,
}: InvitationFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InvitationData>(
    initialData ?? getDefaultFormState(),
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
    (field: keyof InvitationData["location"], value: string | number | undefined) => {
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

  // Current theme for preview
  const currentTheme = useMemo(
    () => themes[form.template] ?? themes["pink-floral"],
    [form.template],
  );

  // Submit
  async function handleSubmit() {
    if (!form.slug) {
      toast.error("Slug is required");
      return;
    }
    if (!form.couple.bride || !form.couple.groom) {
      toast.error("Bride and groom names are required");
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
        throw new Error(data.error ?? "Failed to save");
      }

      toast.success(
        mode === "create"
          ? "Invitation created!"
          : "Invitation updated!",
      );
      router.push("/admin");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save invitation",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* ──────────── Left: Form (55%) ──────────── */}
      <div className="w-[55%] min-w-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4 pb-6">
            {/* Page title */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                {mode === "create" ? "New Invitation" : "Edit Invitation"}
              </h1>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving
                  ? "Saving..."
                  : mode === "create"
                    ? "Create"
                    : "Save Changes"}
              </Button>
            </div>

            <Accordion
              defaultValue={[
                "couple",
                "template",
                "date",
                "location",
                "details",
              ]}
              className="space-y-2"
            >
              {/* ── Couple ── */}
              <AccordionItem value="couple" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  Couple
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="bride">Bride</Label>
                      <Input
                        id="bride"
                        value={form.couple.bride}
                        onChange={(e) =>
                          updateCouple("bride", e.target.value)
                        }
                        placeholder="e.g. Maria"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="groom">Groom</Label>
                      <Input
                        id="groom"
                        value={form.couple.groom}
                        onChange={(e) =>
                          updateCouple("groom", e.target.value)
                        }
                        placeholder="e.g. João"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="monogram">Monogram</Label>
                      <Input
                        id="monogram"
                        value={form.couple.monogram}
                        onChange={(e) =>
                          updateCouple("monogram", e.target.value)
                        }
                        placeholder="Auto-derived (e.g. M&J)"
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

              {/* ── Template ── */}
              <AccordionItem
                value="template"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Template & Media
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="space-y-1.5">
                    <Label>Template</Label>
                    <Select
                      value={form.template}
                      onValueChange={(v) =>
                        update("template", v as TemplateName)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {themes[t]?.label ?? t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="heroImage">Hero Image URL</Label>
                    <Input
                      id="heroImage"
                      value={form.heroImage}
                      onChange={(e) => update("heroImage", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="videoUrl">Video URL (optional)</Label>
                    <Input
                      id="videoUrl"
                      value={form.videoUrl ?? ""}
                      onChange={(e) =>
                        update("videoUrl", e.target.value || undefined)
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quote">Quote</Label>
                    <Textarea
                      id="quote"
                      value={form.quote}
                      onChange={(e) => update("quote", e.target.value)}
                      rows={2}
                      placeholder="A romantic quote..."
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Date & Time ── */}
              <AccordionItem value="date" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  Date & Time
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dateIso">
                        Date (ISO)
                      </Label>
                      <Input
                        id="dateIso"
                        type="date"
                        value={form.date.iso ? form.date.iso.split("T")[0] : ""}
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
                      <Label htmlFor="time">Time</Label>
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
                      <Label htmlFor="display">Display Date</Label>
                      <Input
                        id="display"
                        value={form.date.display}
                        onChange={(e) =>
                          updateDate("display", e.target.value)
                        }
                        placeholder="Auto-derived"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dayOfWeek">Day of Week</Label>
                      <Input
                        id="dayOfWeek"
                        value={form.date.dayOfWeek}
                        onChange={(e) =>
                          updateDate("dayOfWeek", e.target.value)
                        }
                        placeholder="Auto-derived"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Display, day of week, day, month, and year are
                    auto-derived when you pick a date.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* ── Location ── */}
              <AccordionItem
                value="location"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Location
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="locName">Venue Name</Label>
                    <Input
                      id="locName"
                      value={form.location.name}
                      onChange={(e) =>
                        updateLocation("name", e.target.value)
                      }
                      placeholder="e.g. Quinta da Serra"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="locAddress">Address</Label>
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
                      <Label htmlFor="gmaps">Google Maps URL</Label>
                      <Input
                        id="gmaps"
                        value={form.location.googleMapsUrl}
                        onChange={(e) =>
                          updateLocation("googleMapsUrl", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="waze">Waze URL (optional)</Label>
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
                    <Label htmlFor="locImage">Venue Image URL</Label>
                    <Input
                      id="locImage"
                      value={form.location.imageUrl ?? ""}
                      onChange={(e) =>
                        updateLocation("imageUrl", e.target.value)
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Details ── */}
              <AccordionItem
                value="details"
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm font-medium">
                  Details & Options
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Dress Code */}
                  <div className="space-y-1.5">
                    <Label htmlFor="dressCode">Dress Code</Label>
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
                      <Label>RSVP Enabled</Label>
                      <Switch
                        checked={form.rsvp.enabled}
                        onCheckedChange={(v) => updateRsvp("enabled", v)}
                      />
                    </div>
                    {form.rsvp.enabled && (
                      <div className="space-y-1.5">
                        <Label htmlFor="rsvpDeadline">
                          Deadline (optional)
                        </Label>
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
                      <Label>Gift Registry Enabled</Label>
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
                          <Label htmlFor="giftText">Gift Registry Text</Label>
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
                            Gift Registry Link (optional)
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
                      <Label>Audio Enabled</Label>
                      <Switch
                        checked={form.audio.enabled}
                        onCheckedChange={(v) => updateAudio("enabled", v)}
                      />
                    </div>
                    {form.audio.enabled && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="audioSrc">Audio Source URL</Label>
                          <Input
                            id="audioSrc"
                            value={form.audio.src}
                            onChange={(e) =>
                              updateAudio("src", e.target.value)
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="audioArtist">Artist</Label>
                            <Input
                              id="audioArtist"
                              value={form.audio.artist}
                              onChange={(e) =>
                                updateAudio("artist", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="audioTitle">Title</Label>
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
                  Schedule ({form.schedule.length} events)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {form.schedule.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">Time</Label>
                        <Input
                          value={item.time}
                          onChange={(e) =>
                            updateScheduleItem(i, "time", e.target.value)
                          }
                          placeholder="16:00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            updateScheduleItem(i, "label", e.target.value)
                          }
                          placeholder="Cerimónia"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Venue</Label>
                        <Input
                          value={item.venue}
                          onChange={(e) =>
                            updateScheduleItem(i, "venue", e.target.value)
                          }
                          placeholder="Chapel"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addScheduleItem}
                  >
                    + Add Event
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* ── FAQs ── */}
              <AccordionItem value="faqs" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium">
                  FAQs ({(form.faqs ?? []).length} items)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {(form.faqs ?? []).map((faq, i) => (
                    <div key={i} className="space-y-2 border-l-2 pl-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Question</Label>
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
                        <Label className="text-xs">Answer</Label>
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
                    + Add FAQ
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
      </div>

      {/* ──────────── Right: Live Preview (45%) ──────────── */}
      <div className="w-[45%] min-w-0 border-l">
        <div className="h-full flex flex-col">
          <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Live Preview
            </span>
            <span className="text-xs text-muted-foreground">
              {themes[form.template]?.label ?? form.template}
            </span>
          </div>
          <div className="flex-1 overflow-auto bg-neutral-100">
            <div
              className="mx-auto origin-top"
              style={{
                width: 390,
                transform: "scale(0.85)",
                transformOrigin: "top center",
              }}
            >
              {form.couple.bride && form.couple.groom ? (
                <InvitationPage invitation={form} theme={currentTheme} />
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
                  Enter couple names to see preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
