"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MediaUpload from "@/components/admin/MediaUpload";
import type { PlaceItem, PlaceSection, PlacesConfig, PlacesLayout } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PlacesFormSectionProps {
  places: PlacesConfig;
  onEnabledChange: (enabled: boolean) => void;
  onLayoutChange: (layout: PlacesLayout) => void;
  onAddSection: () => void;
  onUpdateSectionTitle: (id: string, title: string) => void;
  onRemoveSection: (id: string) => void;
  onReorderSection: (id: string, direction: "up" | "down") => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (
    sectionId: string,
    itemId: string,
    patch: Partial<PlaceItem>,
  ) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onReorderItem: (
    sectionId: string,
    itemId: string,
    direction: "up" | "down",
  ) => void;
}

export default function PlacesFormSection({
  places,
  onEnabledChange,
  onLayoutChange,
  onAddSection,
  onUpdateSectionTitle,
  onRemoveSection,
  onReorderSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onReorderItem,
}: PlacesFormSectionProps) {
  const sectionCount = places.sections.length;

  return (
    <AccordionItem value="places" className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-medium">
        Locais (Hotéis, Restaurantes…) ({sectionCount} secções)
      </AccordionTrigger>

      <AccordionContent className="space-y-4 pb-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <Label>Seção Ativada</Label>
          <Switch checked={places.enabled} onCheckedChange={onEnabledChange} />
        </div>

        {places.enabled && (
          <>
            {/* Layout switch */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Layout
              </Label>
              <div className="flex rounded-md border overflow-hidden w-fit">
                {(
                  [
                    ["stacked", "Empilhado"],
                    ["rows", "Linhas"],
                  ] as [PlacesLayout, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onLayoutChange(value)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      places.layout === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {places.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  isFirst={index === 0}
                  isLast={index === places.sections.length - 1}
                  onUpdateTitle={(title) =>
                    onUpdateSectionTitle(section.id, title)
                  }
                  onRemove={() => onRemoveSection(section.id)}
                  onReorder={(dir) => onReorderSection(section.id, dir)}
                  onAddItem={() => onAddItem(section.id)}
                  onUpdateItem={(itemId, patch) =>
                    onUpdateItem(section.id, itemId, patch)
                  }
                  onRemoveItem={(itemId) => onRemoveItem(section.id, itemId)}
                  onReorderItem={(itemId, dir) =>
                    onReorderItem(section.id, itemId, dir)
                  }
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddSection}
            >
              + Adicionar secção
            </Button>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

interface SectionEditorProps {
  section: PlaceSection;
  isFirst: boolean;
  isLast: boolean;
  onUpdateTitle: (title: string) => void;
  onRemove: () => void;
  onReorder: (direction: "up" | "down") => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, patch: Partial<PlaceItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onReorderItem: (itemId: string, direction: "up" | "down") => void;
}

function SectionEditor({
  section,
  isFirst,
  isLast,
  onUpdateTitle,
  onRemove,
  onReorder,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onReorderItem,
}: SectionEditorProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      {/* Section title row */}
      <div className="flex items-center gap-2">
        <Input
          value={section.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Título da secção (ex: Hotéis)"
          className="flex-1"
        />
        <div className="flex shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isFirst}
            onClick={() => onReorder("up")}
            aria-label="Mover secção para cima"
          >
            <ChevronUp size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isLast}
            onClick={() => onReorder("down")}
            aria-label="Mover secção para baixo"
          >
            <ChevronDown size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive"
          >
            &times;
          </Button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {section.items.map((item, index) => (
          <ItemEditor
            key={item.id}
            item={item}
            isFirst={index === 0}
            isLast={index === section.items.length - 1}
            onUpdate={(patch) => onUpdateItem(item.id, patch)}
            onRemove={() => onRemoveItem(item.id)}
            onReorder={(dir) => onReorderItem(item.id, dir)}
          />
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
        + Adicionar local
      </Button>
    </div>
  );
}

interface ItemEditorProps {
  item: PlaceItem;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<PlaceItem>) => void;
  onRemove: () => void;
  onReorder: (direction: "up" | "down") => void;
}

function ItemEditor({
  item,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onReorder,
}: ItemEditorProps) {
  return (
    <div className="space-y-2 border-l-2 border-muted pl-3">
      <div className="flex items-center gap-2">
        <Input
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Nome do local"
          className="flex-1"
        />
        <div className="flex shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isFirst}
            onClick={() => onReorder("up")}
            aria-label="Mover local para cima"
          >
            <ChevronUp size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isLast}
            onClick={() => onReorder("down")}
            aria-label="Mover local para baixo"
          >
            <ChevronDown size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive"
          >
            &times;
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descrição</Label>
        <Textarea
          value={item.description ?? ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Breve descrição"
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Imagem</Label>
        <MediaUpload
          kind="image"
          maxSizeMB={3}
          value={item.imageUrl || undefined}
          onUpload={(url) => onUpdate({ imageUrl: url })}
          onClear={() => onUpdate({ imageUrl: "" })}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Link do Google Maps</Label>
        <Input
          value={item.googleMapsUrl ?? ""}
          onChange={(e) => onUpdate({ googleMapsUrl: e.target.value })}
          placeholder="https://maps.google.com/…"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Telefone</Label>
        <Input
          value={item.phone ?? ""}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          placeholder="+351 …"
        />
      </div>
    </div>
  );
}
