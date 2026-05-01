"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MediaUpload from "@/components/admin/MediaUpload";
import SocialPreviewCard from "@/components/admin/SocialPreviewCard";
import type { SocialPreview } from "@/lib/types";

interface SocialPreviewSectionProps {
  /** Current value (may be undefined). */
  value: SocialPreview | undefined;
  /** Called whenever any field changes. */
  onChange: (next: SocialPreview | undefined) => void;
  /** Resolved values to show in the live preview card. */
  resolvedImage: string;
  resolvedTitle: string;
  resolvedDescription: string;
  /** Optional public URL to display under the preview card. */
  publicUrl?: string;
  /** Accordion item value (must be unique within the parent accordion). */
  accordionValue: string;
}

/**
 * Reusable accordion section for editing the social preview
 * (image + title + description) of an Invitation or Save the Date.
 */
export default function SocialPreviewSection({
  value,
  onChange,
  resolvedImage,
  resolvedTitle,
  resolvedDescription,
  publicUrl,
  accordionValue,
}: SocialPreviewSectionProps) {
  function patch(patchValue: Partial<SocialPreview>) {
    const next: SocialPreview = {
      image: value?.image,
      title: value?.title,
      description: value?.description,
      ...patchValue,
    };
    // Normalize: if every field is empty, clear the whole object so the
    // payload is `undefined` (which the API converts to JsonNull).
    const allEmpty = !next.image && !next.title && !next.description;
    onChange(allEmpty ? undefined : next);
  }

  const image = value?.image ?? "";
  const title = value?.title ?? "";
  const description = value?.description ?? "";

  return (
    <AccordionItem value={accordionValue} className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-medium">
        Pré-visualização de partilha
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <p className="text-xs text-muted-foreground">
          Esta imagem aparece quando o link é partilhado em apps como WhatsApp,
          Facebook ou iMessage. Recomendado: 1200×630 pixels.
        </p>

        <div className="space-y-1.5">
          <Label>Imagem</Label>
          <MediaUpload
            kind="image"
            maxSizeMB={5}
            value={image || undefined}
            onUpload={(url) => patch({ image: url })}
            onClear={() => patch({ image: undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="socialPreviewTitle">Título</Label>
          <Input
            id="socialPreviewTitle"
            value={title}
            placeholder={resolvedTitle}
            onChange={(e) => patch({ title: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="socialPreviewDescription">Descrição</Label>
          <Textarea
            id="socialPreviewDescription"
            value={description}
            placeholder={resolvedDescription}
            rows={2}
            onChange={(e) =>
              patch({ description: e.target.value || undefined })
            }
          />
        </div>

        <div className="pt-2">
          <Label className="block mb-2">Pré-visualização</Label>
          <SocialPreviewCard
            image={resolvedImage}
            title={resolvedTitle}
            description={resolvedDescription}
            url={publicUrl}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
