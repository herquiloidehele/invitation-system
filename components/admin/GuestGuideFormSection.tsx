"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MediaUpload from "@/components/admin/MediaUpload";
import { PREDEFINED_GUIDE_ITEMS, isPredefinedItem } from "@/lib/guest-guide";
import { LUCIDE_ICON_INPUT_OPTIONS } from "@/lib/lucide-icons";
import type { GuestGuide, GuestGuideItem } from "@/lib/types";
import { ChevronUp, ChevronDown } from "lucide-react";

const LUCIDE_ICON_DATALIST_ID = "guest-guide-lucide-icons";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GuestGuideFormSectionProps {
  guestGuide: GuestGuide;
  onEnabledChange: (enabled: boolean) => void;
  onTogglePredefined: (item: GuestGuideItem) => void;
  onAddCustom: () => void;
  onUpdateCustom: (id: string, patch: Partial<GuestGuideItem>) => void;
  onRemoveItem: (id: string) => void;
  onReorderItem: (id: string, direction: "up" | "down") => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PredefinedGridProps {
  selectedIds: Set<string>;
  onToggle: (item: GuestGuideItem) => void;
}

function PredefinedGrid({ selectedIds, onToggle }: PredefinedGridProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        Itens predefinidos
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {PREDEFINED_GUIDE_ITEMS.map((preset) => {
          const isSelected = selectedIds.has(preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onToggle(preset)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                isSelected
                  ? "border-primary bg-primary/8 text-primary font-medium"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <span
                className={`shrink-0 h-4 w-4 rounded border flex items-center justify-center ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {isSelected && (
                  <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="leading-tight">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface CustomItemRowProps {
  item: GuestGuideItem;
  onUpdate: (patch: Partial<GuestGuideItem>) => void;
  onRemove: () => void;
}

function CustomItemRow({ item, onUpdate, onRemove }: CustomItemRowProps) {
  return (
    <div className="space-y-2 border-l-2 border-muted pl-3">
      <div className="flex items-center gap-2">
        {/* Icon type toggle */}
        <div className="flex rounded-md border overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => onUpdate({ iconType: "lucide", iconUrl: undefined })}
            className={`px-2 py-1 text-xs transition-colors ${
              item.iconType === "lucide"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Ícone
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ iconType: "svg", iconName: undefined })}
            className={`px-2 py-1 text-xs transition-colors ${
              item.iconType === "svg"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            SVG
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ iconType: "image", iconName: undefined })}
            className={`px-2 py-1 text-xs transition-colors ${
              item.iconType === "image"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Imagem
          </button>
        </div>

        <div className="flex-1 space-y-1">
          <Label className="text-xs">Descrição</Label>
          <Input
            value={item.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Texto do item"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive mt-5 shrink-0"
        >
          &times;
        </Button>
      </div>

      {item.iconType === "lucide" ? (
        <div className="space-y-1">
          <Label className="text-xs">Nome do ícone Lucide</Label>
          <Input
            value={item.iconName ?? ""}
            onChange={(e) => onUpdate({ iconName: e.target.value })}
            list={LUCIDE_ICON_DATALIST_ID}
            placeholder="ex: Star, Heart, Music..."
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Consulte{" "}
            <a
              href="https://lucide.dev/icons"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              lucide.dev/icons
            </a>{" "}
            para os nomes disponíveis.
          </p>
        </div>
      ) : item.iconType === "svg" ? (
        <div className="space-y-1">
          <Label className="text-xs">SVG do ícone</Label>
          <MediaUpload
            kind="svg"
            maxSizeMB={1}
            value={item.iconUrl || undefined}
            onUpload={(url) => onUpdate({ iconUrl: url })}
            onClear={() => onUpdate({ iconUrl: "" })}
          />
          <p className="text-xs text-muted-foreground">
            Use SVGs simples para que a cor acompanhe o tema automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">Imagem do ícone</Label>
          <MediaUpload
            kind="image"
            maxSizeMB={2}
            value={item.iconUrl || undefined}
            onUpload={(url) => onUpdate({ iconUrl: url })}
            onClear={() => onUpdate({ iconUrl: "" })}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface ReorderListProps {
  items: GuestGuideItem[];
  onReorder: (id: string, direction: "up" | "down") => void;
}

function ReorderList({ items, onReorder }: ReorderListProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        Ordenar itens
      </Label>
      <div className="space-y-1">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          const isPredefined = isPredefinedItem(item.id);
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <span className="flex-1 text-xs leading-tight truncate">
                {item.label || "(sem título)"}
              </span>
              {isPredefined ? (
                <span className="shrink-0 text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                  predefinido
                </span>
              ) : (
                <span className="shrink-0 text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5">
                  personalizado
                </span>
              )}
              <div className="flex shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isFirst}
                  onClick={() => onReorder(item.id, "up")}
                  aria-label="Mover para cima"
                >
                  <ChevronUp size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isLast}
                  onClick={() => onReorder(item.id, "down")}
                  aria-label="Mover para baixo"
                >
                  <ChevronDown size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GuestGuideFormSection — AccordionItem for the admin editor
// ---------------------------------------------------------------------------

export default function GuestGuideFormSection({
  guestGuide,
  onEnabledChange,
  onTogglePredefined,
  onAddCustom,
  onUpdateCustom,
  onRemoveItem,
  onReorderItem,
}: GuestGuideFormSectionProps) {
  const selectedIds = new Set(guestGuide.items.map((i) => i.id));
  const customItems = guestGuide.items.filter((i) => !isPredefinedItem(i.id));

  return (
    <AccordionItem value="guest-guide" className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-medium">
        Manual do Bom Convidado ({guestGuide.items.length} itens)
      </AccordionTrigger>

      <AccordionContent className="space-y-4 pb-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <Label>Seção Ativada</Label>
          <Switch
            checked={guestGuide.enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>

        {guestGuide.enabled && (
          <>
            <datalist id={LUCIDE_ICON_DATALIST_ID}>
              {LUCIDE_ICON_INPUT_OPTIONS.map((iconName) => (
                <option key={iconName} value={iconName} />
              ))}
            </datalist>

            <PredefinedGrid
              selectedIds={selectedIds}
              onToggle={onTogglePredefined}
            />

            <Separator />

            {/* Custom items */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Itens personalizados
              </Label>

              {customItems.map((item) => (
                <CustomItemRow
                  key={item.id}
                  item={item}
                  onUpdate={(patch) => onUpdateCustom(item.id, patch)}
                  onRemove={() => onRemoveItem(item.id)}
                />
              ))}

              <Button variant="outline" size="sm" onClick={onAddCustom}>
                + Adicionar item personalizado
              </Button>
            </div>

            {guestGuide.items.length >= 2 && (
              <>
                <Separator />
                <ReorderList
                  items={guestGuide.items}
                  onReorder={onReorderItem}
                />
              </>
            )}
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
