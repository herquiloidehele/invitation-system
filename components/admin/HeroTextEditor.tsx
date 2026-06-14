"use client";

import { useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  EMPTY_HERO_TEXT_LAYER,
  heroTextBlockStyle,
  pxToPct,
  type ResolvedHeroFonts,
} from "@/lib/hero-text";
import {
  addBlock,
  bringToFront,
  duplicateBlock,
  moveBlock,
  removeBlock,
  updateBlock,
} from "@/lib/hero-text-editor";
import type {
  HeroTextBlock,
  HeroTextFontKey,
  HeroTextLayer,
} from "@/lib/types";

interface HeroTextEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: HeroTextLayer;
  onChange: (next: HeroTextLayer) => void;
  /** Background still: image URL or video poster. */
  stillUrl?: string;
  /** Design-surface aspect ratio (width / height). */
  aspectRatio: number;
  /** Resolved fonts for WYSIWYG preview. */
  fonts: ResolvedHeroFonts;
}

const SURFACE_WIDTH = 340;
const MAX_SURFACE_HEIGHT = 460;

const FONT_OPTIONS: { value: HeroTextFontKey; label: string }[] = [
  { value: "display", label: "Display" },
  { value: "script", label: "Script" },
  { value: "body", label: "Corpo" },
  { value: "ui", label: "UI" },
];

const ALIGN_OPTIONS = [
  { value: "left", Icon: AlignLeft, label: "Alinhar à esquerda" },
  { value: "center", Icon: AlignCenter, label: "Centrar" },
  { value: "right", Icon: AlignRight, label: "Alinhar à direita" },
] as const;

function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `htb-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export default function HeroTextEditor({
  open,
  onOpenChange,
  value,
  onChange,
  stillUrl,
  aspectRatio,
  fonts,
}: HeroTextEditorProps) {
  const layer = value ?? EMPTY_HERO_TEXT_LAYER;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const selected = layer.blocks.find((b) => b.id === selectedId) ?? null;

  // Fit the design surface to the hero aspect, capped so a tall (video)
  // hero doesn't blow past the dialog height.
  const ratio = aspectRatio || 1;
  let surfaceWidth = SURFACE_WIDTH;
  let surfaceHeight = surfaceWidth / ratio;
  if (surfaceHeight > MAX_SURFACE_HEIGHT) {
    surfaceHeight = MAX_SURFACE_HEIGHT;
    surfaceWidth = surfaceHeight * ratio;
  }
  surfaceWidth = Math.round(surfaceWidth);
  surfaceHeight = Math.round(surfaceHeight);

  function patch(p: Partial<HeroTextBlock>) {
    if (!selected) return;
    onChange(updateBlock(layer, selected.id, p));
  }

  function handleAdd() {
    const id = newId();
    onChange(addBlock(layer, id));
    setSelectedId(id);
  }

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    block: HeroTextBlock,
  ) {
    e.stopPropagation();
    setSelectedId(block.id);
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + (block.xPct / 100) * rect.width;
    const centerY = rect.top + (block.yPct / 100) * rect.height;
    dragOffset.current = { x: e.clientX - centerX, y: e.clientY - centerY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLDivElement>,
    block: HeroTextBlock,
  ) {
    if (!dragOffset.current) return;
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = e.clientX - dragOffset.current.x - rect.left;
    const centerY = e.clientY - dragOffset.current.y - rect.top;
    onChange(
      moveBlock(
        layer,
        block.id,
        pxToPct(centerX, rect.width),
        pxToPct(centerY, rect.height),
      ),
    );
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragOffset.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Textos do hero</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Design surface */}
          <div
            className="flex flex-shrink-0 flex-col items-center gap-2"
            style={{ width: surfaceWidth }}
          >
            <div
              ref={surfaceRef}
              onPointerDown={() => setSelectedId(null)}
              className="relative overflow-hidden rounded-md bg-neutral-700"
              style={{
                width: surfaceWidth,
                height: surfaceHeight,
                containerType: "inline-size",
                backgroundImage: stillUrl ? `url(${stillUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {layer.blocks.map((block) => (
                <div
                  key={block.id}
                  onPointerDown={(e) => handlePointerDown(e, block)}
                  onPointerMove={(e) => handlePointerMove(e, block)}
                  onPointerUp={handlePointerUp}
                  style={{
                    ...heroTextBlockStyle(block, fonts),
                    cursor: "move",
                    outline:
                      block.id === selectedId
                        ? "1.5px dashed #85B7EB"
                        : "1px solid rgba(255,255,255,0.25)",
                    outlineOffset: 3,
                    touchAction: "none",
                  }}
                >
                  {block.content || " "}
                </div>
              ))}
            </div>
            <p className="w-full text-center text-xs text-muted-foreground">
              Arraste os textos para posicioná-los. As posições escalam para
              todos os ecrãs.
            </p>
            <Button type="button" variant="outline" onClick={handleAdd}>
              + Adicionar texto
            </Button>
          </div>

          {/* Inspector */}
          <div className="min-w-0 flex-1 space-y-3">
            {!selected && (
              <p className="text-sm text-muted-foreground">
                Selecione um texto na pré-visualização para editar, ou adicione
                um novo.
              </p>
            )}

            {selected && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Texto</Label>
                  <Textarea
                    value={selected.content}
                    rows={2}
                    onChange={(e) => patch({ content: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Fonte</Label>
                  <Select
                    value={selected.fontKey}
                    onValueChange={(v) =>
                      v && patch({ fontKey: v as HeroTextFontKey })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tamanho ({selected.fontSizeCqw})</Label>
                    <input
                      type="range"
                      min={2}
                      max={24}
                      step={0.5}
                      value={selected.fontSizeCqw}
                      onChange={(e) =>
                        patch({ fontSizeCqw: parseFloat(e.target.value) })
                      }
                      className="w-full accent-foreground cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Largura ({selected.widthPct}%)</Label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={selected.widthPct}
                      onChange={(e) =>
                        patch({ widthPct: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-foreground cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="htb-color">Cor</Label>
                    <input
                      id="htb-color"
                      type="color"
                      value={selected.color}
                      onChange={(e) => patch({ color: e.target.value })}
                      className="h-9 w-full cursor-pointer rounded-md border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Peso</Label>
                    <Select
                      value={String(selected.fontWeight)}
                      onValueChange={(v) =>
                        v && patch({ fontWeight: parseInt(v, 10) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[300, 400, 500, 600, 700].map((w) => (
                          <SelectItem key={w} value={String(w)}>
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={
                      selected.fontStyle === "italic" ? "default" : "outline"
                    }
                    onClick={() =>
                      patch({
                        fontStyle:
                          selected.fontStyle === "italic"
                            ? "normal"
                            : "italic",
                      })
                    }
                  >
                    Itálico
                  </Button>
                  {ALIGN_OPTIONS.map(({ value, Icon, label }) => (
                    <Button
                      key={value}
                      type="button"
                      size="icon"
                      aria-label={label}
                      variant={
                        selected.textAlign === value ? "default" : "outline"
                      }
                      onClick={() => patch({ textAlign: value })}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={selected.shadow ? "default" : "outline"}
                    onClick={() => patch({ shadow: !selected.shadow })}
                  >
                    Sombra
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Espaçamento ({selected.letterSpacing}em)</Label>
                    <input
                      type="range"
                      min={-0.1}
                      max={1}
                      step={0.01}
                      value={selected.letterSpacing}
                      onChange={(e) =>
                        patch({ letterSpacing: parseFloat(e.target.value) })
                      }
                      className="w-full accent-foreground cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rotação ({selected.rotation ?? 0}°)</Label>
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      step={1}
                      value={selected.rotation ?? 0}
                      onChange={(e) =>
                        patch({ rotation: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-foreground cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const id = newId();
                      onChange(duplicateBlock(layer, selected.id, id));
                      setSelectedId(id);
                    }}
                  >
                    Duplicar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onChange(bringToFront(layer, selected.id))}
                  >
                    Trazer p/ frente
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      onChange(removeBlock(layer, selected.id));
                      setSelectedId(null);
                    }}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
