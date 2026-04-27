"use client";

import { Copy, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WhatsAppIcon } from "@/components/shared/icons/WhatsAppIcon";
import {
  buildPersonalInviteUrl,
  buildSmsUrl,
  buildWhatsAppUrl,
  renderMessageTemplate,
} from "@/lib/guest-links";
import type { GuestData } from "@/lib/types";

interface GuestRowActionsProps {
  guest: GuestData;
  invitationSlug: string;
  invitationOrigin: string;
  messageTemplate: string;
  onEdit: (guest: GuestData) => void;
  onDelete: (guest: GuestData) => void;
}

export default function GuestRowActions({
  guest,
  invitationSlug,
  invitationOrigin,
  messageTemplate,
  onEdit,
  onDelete,
}: GuestRowActionsProps) {
  const personalUrl = buildPersonalInviteUrl({
    origin: invitationOrigin,
    slug: invitationSlug,
    token: guest.token,
    name: guest.name,
  });
  const message = renderMessageTemplate(messageTemplate, {
    name: guest.name,
    link: personalUrl,
  });
  const waUrl = buildWhatsAppUrl({
    countryCode: guest.phoneCountryCode,
    phoneNumber: guest.phoneNumber,
    message,
  });
  const smsUrl = buildSmsUrl({
    countryCode: guest.phoneCountryCode,
    phoneNumber: guest.phoneNumber,
    message,
  });

  const hasPhone = !!guest.phoneNumber;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(personalUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleCopy}
              aria-label="Copiar link pessoal"
            >
              <Copy className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Copiar link pessoal</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-[#25D366] hover:text-[#1ebe57]"
              disabled={!hasPhone}
              onClick={() => window.open(waUrl, "_blank", "noopener,noreferrer")}
              aria-label="Abrir WhatsApp"
            >
              <WhatsAppIcon className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>
          {hasPhone ? "Abrir WhatsApp" : "Sem telefone"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={!hasPhone}
              onClick={() =>
                window.open(smsUrl, "_blank", "noopener,noreferrer")
              }
              aria-label="Abrir SMS"
            >
              <MessageSquareText className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>
          {hasPhone ? "Enviar SMS" : "Sem telefone"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(guest)}
              aria-label="Editar convidado"
            >
              <Pencil className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(guest)}
              aria-label="Apagar convidado"
            >
              <Trash2 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Apagar</TooltipContent>
      </Tooltip>
    </div>
  );
}
