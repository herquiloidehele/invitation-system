"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Mirrors the zod limit in /api/admin/invitations/[id]/block. */
export const BLOCK_REASON_MAX_LENGTH = 500;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupleName: string;
  pending: boolean;
  onConfirm: (reason: string) => void;
};

/**
 * Confirmation dialog for blocking one invitation from the admin list.
 * Collects an optional reason that guests and the host will see on the
 * blocked page. The textarea resets whenever the dialog closes.
 */
export function BlockInvitationDialog({
  open,
  onOpenChange,
  coupleName,
  pending,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear convite</DialogTitle>
          <DialogDescription>
            O convite de <strong>{coupleName}</strong> deixará de estar
            acessível. Convidados e anfitriões verão uma mensagem a informar
            que o convite foi bloqueado. Pode desbloqueá-lo a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="block-invitation-reason">Motivo (opcional)</Label>
          <Textarea
            id="block-invitation-reason"
            value={reason}
            maxLength={BLOCK_REASON_MAX_LENGTH}
            placeholder="Ex.: pagamento pendente"
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            Será mostrado na página bloqueada, tal como o escrever.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={pending}
          >
            {pending ? "A bloquear..." : "Bloquear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
