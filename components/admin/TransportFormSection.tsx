"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MediaUpload from "@/components/admin/MediaUpload";
import { EMPTY_TRANSPORT_INFO } from "@/lib/minimalism-brown";
import type { TransportImageSize, TransportInfo } from "@/lib/types";

const IMAGE_SIZE_OPTIONS: { value: TransportImageSize; label: string }[] = [
  { value: "small", label: "Pequena" },
  { value: "medium", label: "Média" },
  { value: "full", label: "Largura total" },
];

interface TransportFormSectionProps {
  /** Unset on invitations saved before the section existed. */
  value: TransportInfo | undefined;
  /** The Portuguese record, shown as placeholders while translating. */
  sourceValue?: TransportInfo;
  sourcePlaceholder: (source: string | undefined, ordinary: string) => string;
  onChange: (patch: Partial<TransportInfo>) => void;
}

/** AccordionItem for the minimalism-brown transport section. */
export default function TransportFormSection({
  value,
  sourceValue,
  sourcePlaceholder,
  onChange,
}: TransportFormSectionProps) {
  const transport = value ?? EMPTY_TRANSPORT_INFO;

  return (
    <AccordionItem value="transportInfo" className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-medium">
        Transporte {transport.enabled ? "(ativo)" : "(desativado)"}
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={transport.enabled}
            onCheckedChange={(enabled) => onChange({ enabled })}
          />
          <Label className="text-xs text-muted-foreground">
            Mostrar secção &quot;Transporte&quot;
          </Label>
        </div>

        {transport.enabled && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Imagem (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Aparece no topo da secção, por cima do título.
              </p>
              <MediaUpload
                kind="image"
                maxSizeMB={5}
                value={transport.imageUrl}
                onUpload={(imageUrl) => onChange({ imageUrl })}
                onClear={() => onChange({ imageUrl: undefined })}
              />
            </div>

            {transport.imageUrl && (
              <div className="space-y-1">
                <Label className="text-xs">Tamanho da imagem</Label>
                <Select
                  value={transport.imageSize ?? "medium"}
                  onValueChange={(imageSize) =>
                    onChange({ imageSize: imageSize as TransportImageSize })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar tamanho">
                      {(selected: string | null) =>
                        IMAGE_SIZE_OPTIONS.find(
                          (option) => option.value === selected,
                        )?.label ?? selected
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Título</Label>
              <Input
                value={transport.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder={sourcePlaceholder(
                  sourceValue?.title,
                  EMPTY_TRANSPORT_INFO.title,
                )}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Textarea
                value={transport.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder={sourcePlaceholder(
                  sourceValue?.description,
                  "Ex: Haverá autocarro a partir da igreja às 14h00.",
                )}
                rows={5}
              />
            </div>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
