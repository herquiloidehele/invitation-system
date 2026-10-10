"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EMPTY_GUEST_PHOTO_UPLOAD, mbWebLink } from "@/lib/minimalism-brown";
import type { GuestPhotoUpload } from "@/lib/types";

interface GuestPhotoUploadFormSectionProps {
  /** Unset on invitations saved before the block existed. */
  value: GuestPhotoUpload | undefined;
  /** The Portuguese record, shown as placeholders while translating. */
  sourceValue?: GuestPhotoUpload;
  sourcePlaceholder: (source: string | undefined, ordinary: string) => string;
  onChange: (patch: Partial<GuestPhotoUpload>) => void;
}

/** AccordionItem for the minimalism-brown "send us your photos" block. */
export default function GuestPhotoUploadFormSection({
  value,
  sourceValue,
  sourcePlaceholder,
  onChange,
}: GuestPhotoUploadFormSectionProps) {
  const upload = value ?? EMPTY_GUEST_PHOTO_UPLOAD;
  const hasLink = upload.url.trim() !== "";
  const linkIsValid = mbWebLink(upload.url) !== null;

  return (
    <AccordionItem value="guestPhotoUpload" className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-medium">
        Fotos dos Convidados {upload.enabled ? "(ativo)" : "(desativado)"}
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={upload.enabled}
            onCheckedChange={(enabled) => onChange({ enabled })}
          />
          <Label className="text-xs text-muted-foreground">
            Mostrar botão para os convidados enviarem fotos
          </Label>
        </div>

        {upload.enabled && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Link da plataforma</Label>
              <Input
                type="url"
                inputMode="url"
                value={upload.url}
                onChange={(e) => onChange({ url: e.target.value })}
                placeholder="https://photos.app.goo.gl/..."
                aria-invalid={hasLink && !linkIsValid}
              />
              {hasLink && !linkIsValid ? (
                <p className="text-xs text-destructive">
                  Este link não é válido. Cole o endereço completo da
                  plataforma.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {hasLink
                    ? "Abre num novo separador quando o convidado toca no botão."
                    : "Sem link, o texto e o botão não aparecem no convite."}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Texto</Label>
              <Textarea
                value={upload.text}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder={sourcePlaceholder(
                  sourceValue?.text,
                  "Ex: Partilhem connosco as fotos que tirarem no nosso dia!",
                )}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Aparece por cima do botão, logo a seguir à galeria. O texto do
                botão (&quot;Enviar fotos&quot;) altera-se em Textos
                Personalizados.
              </p>
            </div>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
