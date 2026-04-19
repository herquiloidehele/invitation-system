"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SaveTheDateThemeData } from "@/lib/save-the-date";
import SaveTheDateView from "@/components/save-the-date/SaveTheDateView";

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SaveTheDateForm({ mode, initialData, themes }: Props) {
  const router = useRouter();
  const [data, setData] = useState<SaveTheDateFormData>(initialData);
  const [saving, setSaving] = useState(false);

  const selectedTheme = useMemo(
    () => themes.find((t) => t.id === data.themeId) || themes[0],
    [themes, data.themeId]
  );

  // Preview data
  const previewData = useMemo(
    () => ({
      id: data.id || "preview",
      slug: data.slug || "preview",
      couple: data.couple,
      date: data.date,
      customMessage: data.customMessage || null,
      theme: selectedTheme,
    }),
    [data, selectedTheme]
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
    [mode]
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

  const handleSubmit = async () => {
    if (!data.slug || !data.themeId || !data.couple.bride || !data.couple.groom || !data.date.iso) {
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
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao guardar");
      }

      const result = await res.json();
      toast.success(
        mode === "create"
          ? "Save the Date criado com sucesso!"
          : "Save the Date atualizado!"
      );

      if (mode === "create") {
        router.push(`/admin/save-the-dates/${result.id}/edit`);
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
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* Left: Form */}
      <ScrollArea className="w-[55%] pr-4">
        <div className="space-y-6 pb-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "create"
                ? "Novo Save the Date"
                : "Editar Save the Date"}
            </h1>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {mode === "create" ? "Criar" : "Guardar"}
            </Button>
          </div>

          <Accordion
            defaultValue={["couple", "theme", "date", "message"]}
            className="space-y-2"
          >
            {/* Couple */}
            <AccordionItem value="couple">
              <AccordionTrigger>Casal</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Noiva</Label>
                    <Input
                      value={data.couple.bride}
                      onChange={(e) => updateCouple("bride", e.target.value)}
                      placeholder="Alba"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Noivo</Label>
                    <Input
                      value={data.couple.groom}
                      onChange={(e) => updateCouple("groom", e.target.value)}
                      placeholder="Javier"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={data.slug}
                    onChange={(e) =>
                      setData((p) => ({ ...p, slug: e.target.value }))
                    }
                    placeholder="alba-javier"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /s/{data.slug || "..."}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Theme */}
            <AccordionItem value="theme">
              <AccordionTrigger>Modelo</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={data.themeId}
                    onValueChange={(v) =>
                      setData((p) => ({ ...p, themeId: v || p.themeId }))
                    }
                  >
                    <SelectTrigger>
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

            {/* Date */}
            <AccordionItem value="date">
              <AccordionTrigger>Data</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Data do Evento (ISO)</Label>
                  <Input
                    type="date"
                    value={data.date.iso}
                    onChange={(e) => updateDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Dia</Label>
                    <Input value={data.date.day} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Input
                      value={data.date.month}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Input
                      value={data.date.year}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Display</Label>
                  <Input
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

            {/* Custom message */}
            <AccordionItem value="message">
              <AccordionTrigger>Mensagem personalizada</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Mensagem (aparece após revelação)</Label>
                  <Textarea
                    value={data.customMessage}
                    onChange={(e) =>
                      setData((p) => ({ ...p, customMessage: e.target.value }))
                    }
                    placeholder="estão convidados para celebrar o dia"
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Right: Live preview */}
      <div className="w-[45%] flex items-start justify-center pt-4">
        <div className="sticky top-4">
          {/* Phone frame */}
          <div className="relative mx-auto w-[320px] h-[640px] rounded-[2.5rem] border-[8px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
            {/* Dynamic island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-[100px] h-[28px] bg-black rounded-full" />
            {/* Screen content */}
            <div className="h-full w-full overflow-auto rounded-[2rem] bg-white">
              {selectedTheme ? (
                <div className="pointer-events-none scale-[0.85] origin-top">
                  <SaveTheDateView saveTheDate={previewData} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Selecione um tema
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
