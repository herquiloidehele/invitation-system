"use client";

import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import MediaUpload from "@/components/admin/MediaUpload";
import type { DressCode, DressColor } from "@/lib/types";

/**
 * Extra dress-code fields used only by the Elegant Floral layout: title/intro,
 * a ladies section (label, note, named-color palette, gowns illustration), a
 * gentlemen section (label, note, suits illustration), and a reserved-colors
 * note. Kept out of the giant InvitationForm so each file stays focused.
 */
export default function ElegantFloralDressFields({
  value,
  onChange,
}: {
  value: DressCode;
  onChange: (patch: Partial<DressCode>) => void;
}) {
  const ladies = value.ladies ?? {};
  const gentlemen = value.gentlemen ?? {};
  const palette = ladies.palette ?? [];

  const patchLadies = (p: Partial<NonNullable<DressCode["ladies"]>>) =>
    onChange({ ladies: { ...ladies, ...p } });
  const patchGentlemen = (p: Partial<NonNullable<DressCode["gentlemen"]>>) =>
    onChange({ gentlemen: { ...gentlemen, ...p } });
  const setPalette = (next: DressColor[]) => patchLadies({ palette: next });

  return (
    <div className="space-y-4 rounded-md border border-dashed p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Campos do modelo Elegant Floral
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs">Título (ex: LE JARDIN DE PARADIS)</Label>
        <Input
          value={value.title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Introdução</Label>
        <Textarea
          value={value.intro ?? ""}
          onChange={(e) => onChange({ intro: e.target.value })}
          placeholder="Uma noite de elegância, romance e sofisticação."
        />
      </div>

      {/* Ladies */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs font-semibold">Senhoras</Label>
        <Input
          value={ladies.label ?? ""}
          onChange={(e) => patchLadies({ label: e.target.value })}
          placeholder="Rótulo (ex: SENHORAS)"
        />
        <Textarea
          value={ladies.note ?? ""}
          onChange={(e) => patchLadies({ note: e.target.value })}
          placeholder="Nota (ex: VESTIDOS LONGOS EM TONS COMO:)"
        />

        <Label className="text-xs">Lista de tons (nomes)</Label>
        <div className="space-y-2">
          {palette.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={c.name}
                onChange={(e) =>
                  setPalette(
                    palette.map((x, j) =>
                      j === i ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
                placeholder="Azul safira"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPalette(palette.filter((_, j) => j !== i))}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPalette([...palette, { name: "" }])}
          >
            <Plus size={14} className="mr-1" /> Adicionar tom
          </Button>
        </div>

        <Label className="text-xs">Ilustração (vestidos)</Label>
        <MediaUpload
          kind="image"
          maxSizeMB={5}
          value={ladies.imageUrl || undefined}
          onUpload={(url) => patchLadies({ imageUrl: url })}
          onClear={() => patchLadies({ imageUrl: "" })}
        />
      </div>

      {/* Gentlemen */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs font-semibold">Senhores</Label>
        <Input
          value={gentlemen.label ?? ""}
          onChange={(e) => patchGentlemen({ label: e.target.value })}
          placeholder="Rótulo (ex: SENHORES)"
        />
        <Textarea
          value={gentlemen.note ?? ""}
          onChange={(e) => patchGentlemen({ note: e.target.value })}
          placeholder="Smoking ou fato escuro elegante…"
        />
        <Label className="text-xs">Ilustração (fatos)</Label>
        <MediaUpload
          kind="image"
          maxSizeMB={5}
          value={gentlemen.imageUrl || undefined}
          onUpload={(url) => patchGentlemen({ imageUrl: url })}
          onClear={() => patchGentlemen({ imageUrl: "" })}
        />
      </div>

      {/* Reserved-colors note */}
      <div className="space-y-1.5 border-t pt-3">
        <Label className="text-xs">Nota (cores reservadas)</Label>
        <Textarea
          value={value.reservedNote ?? ""}
          onChange={(e) => onChange({ reservedNote: e.target.value })}
          placeholder="Vermelho é reservado às madrinhas e mães…"
        />
      </div>
    </div>
  );
}
