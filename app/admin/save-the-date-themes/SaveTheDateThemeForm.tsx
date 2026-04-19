"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";

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
  heartTextureUrl: string;
  bgColor: string;
  titleFont: string;
  coupleFont: string;
  dateFont: string;
  textColor: string;
  confettiColors: string[];
}

interface Props {
  mode: "create" | "edit";
  initialData: STDThemeFormData;
}

// ---------------------------------------------------------------------------
// Color field
// ---------------------------------------------------------------------------

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border p-0"
        />
        <Input
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
    <div className="space-y-2">
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
      if (!body.heartTextureUrl) delete (body as { heartTextureUrl?: string }).heartTextureUrl;

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
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* Left: Form */}
      <ScrollArea className="w-[55%] pr-4">
        <div className="space-y-6 pb-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "create" ? "Novo Modelo STD" : "Editar Modelo STD"}
            </h1>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {mode === "create" ? "Criar" : "Guardar"}
            </Button>
          </div>

          <Accordion
            defaultValue={["identity", "heart", "colors", "typography", "confetti"]}
            className="space-y-2"
          >
            {/* Identity */}
            <AccordionItem value="identity">
              <AccordionTrigger>Identidade</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Slug (name)</Label>
                  <Input
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="golden-heart"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={data.label}
                    onChange={(e) => update("label", e.target.value)}
                    placeholder="Golden Heart"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={data.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Classic gold glitter heart scratch-off"
                    rows={2}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Heart */}
            <AccordionItem value="heart">
              <AccordionTrigger>Coração</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <ColorField
                  label="Cor do Coração"
                  value={data.heartColor}
                  onChange={(v) => update("heartColor", v)}
                />
                <ColorArrayField
                  label="Cores Glitter"
                  value={data.heartGlitterColors}
                  onChange={(v) => update("heartGlitterColors", v)}
                />
                <div className="space-y-2">
                  <Label className="text-xs">URL Textura (opcional)</Label>
                  <Input
                    value={data.heartTextureUrl}
                    onChange={(e) => update("heartTextureUrl", e.target.value)}
                    placeholder="https://..."
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL de uma imagem de textura glitter. Se vazio, usa textura
                    gerada.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Colors */}
            <AccordionItem value="colors">
              <AccordionTrigger>Cores</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <ColorField
                  label="Fundo da Página"
                  value={data.bgColor}
                  onChange={(v) => update("bgColor", v)}
                />
                <ColorField
                  label="Cor do Texto"
                  value={data.textColor}
                  onChange={(v) => update("textColor", v)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Typography */}
            <AccordionItem value="typography">
              <AccordionTrigger>Tipografia</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Fonte do Título</Label>
                  <Input
                    value={data.titleFont}
                    onChange={(e) => update("titleFont", e.target.value)}
                    placeholder="'Great Vibes', cursive"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fonte do Casal</Label>
                  <Input
                    value={data.coupleFont}
                    onChange={(e) => update("coupleFont", e.target.value)}
                    placeholder="'Cormorant Garamond', serif"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fonte da Data</Label>
                  <Input
                    value={data.dateFont}
                    onChange={(e) => update("dateFont", e.target.value)}
                    placeholder="'Cormorant Garamond', serif"
                    className="font-mono text-xs"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Confetti */}
            <AccordionItem value="confetti">
              <AccordionTrigger>Confetti</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <ColorArrayField
                  label="Cores do Confetti"
                  value={data.confettiColors}
                  onChange={(v) => update("confettiColors", v)}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Right: Preview */}
      <div className="w-[45%] flex items-start justify-center pt-4">
        <div className="sticky top-4">
          {/* Heart preview */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold">Pré-visualização</h3>
            <div
              className="flex flex-col items-center gap-4 p-8 rounded-lg"
              style={{ backgroundColor: data.bgColor }}
            >
              <span
                className="text-2xl"
                style={{ fontFamily: data.titleFont, color: data.textColor }}
              >
                Save the Date
              </span>
              <svg viewBox="0 0 100 100" className="h-32 w-32">
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
                          (i /
                            Math.max(data.heartGlitterColors.length - 1, 1)) *
                          100
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
            </div>

            {/* Confetti swatches */}
            <div className="flex gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground mr-2">
                Confetti:
              </span>
              {data.confettiColors.map((c, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
