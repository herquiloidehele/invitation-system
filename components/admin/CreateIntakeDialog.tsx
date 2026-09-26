"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getIntakePath } from "@/lib/admin-row-navigation";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/guest-links";
import type { IntakeKind } from "@/lib/intake/catalog";
import {
  buildAdminInviteMessage,
  buildCustomerWhatsappUrl,
  joinWhatsapp,
} from "@/lib/intake/links";
import { cn } from "@/lib/utils";

export interface IntakeDemoOption {
  kind: IntakeKind;
  id: string;
  name: string;
}

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const KIND_LABELS: Record<IntakeKind, string> = {
  convite: "Convite",
  "save-the-date": "Save the Date",
};

/**
 * Creates a personal intake link for a customer. With `preset` the demo is
 * fixed (opened from a demo row or edit page); otherwise the admin picks one.
 */
export function CreateIntakeDialog({
  open,
  onOpenChange,
  demos = [],
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demos?: IntakeDemoOption[];
  preset?: IntakeDemoOption;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<IntakeKind>(preset?.kind ?? "convite");
  const [demoId, setDemoId] = useState(preset?.id ?? "");
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState(DEFAULT_COUNTRY_CODE);
  const [number, setNumber] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const kindDemos = useMemo(
    () => demos.filter((demo) => demo.kind === kind),
    [demos, kind],
  );
  const selectedDemo = preset ?? demos.find((demo) => demo.id === demoId);
  const digits = number.trim() ? joinWhatsapp(prefix, number) : "";

  function reset() {
    setKind(preset?.kind ?? "convite");
    setDemoId(preset?.id ?? "");
    setName("");
    setPrefix(DEFAULT_COUNTRY_CODE);
    setNumber("");
    setCreated(null);
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (created) router.refresh();
      reset();
    }
    onOpenChange(next);
  }

  async function handleCreate() {
    if (!selectedDemo) {
      toast.error("Escolha um modelo.");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/admin/intakes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productKind: selectedDemo.kind,
          demoId: selectedDemo.id,
          contactName: name.trim() || undefined,
          contactWhatsapp: digits || undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(
          response.status === 400
            ? "Verifique o nome e o número de WhatsApp."
            : "Não foi possível criar o formulário.",
        );
        return;
      }
      setCreated({ id: body.id, url: body.url });
    } catch {
      toast.error("Sem ligação ao servidor.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  const whatsappHref = created && selectedDemo
    ? digits
      ? buildCustomerWhatsappUrl(
          digits,
          buildAdminInviteMessage({
            name,
            demoName: selectedDemo.name,
            url: created.url,
          }),
        )
      : `https://wa.me/?text=${encodeURIComponent(
          buildAdminInviteMessage({
            name,
            demoName: selectedDemo.name,
            url: created.url,
          }),
        )}`
    : "#";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {created ? "Formulário criado" : "Novo formulário de cliente"}
          </DialogTitle>
          <DialogDescription>
            {created
              ? "Envie este link ao cliente. As respostas ficam guardadas à medida que preenche."
              : "Gera um link pessoal para o cliente preencher os detalhes do convite."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={created.url}
                className="h-9 font-mono text-xs"
                onClick={(event) => (event.target as HTMLInputElement).select()}
              />
              <Button variant="outline" className="h-9 shrink-0" onClick={handleCopy}>
                {copied ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "default" }), "h-9 w-full")}
            >
              <MessageCircle className="size-4" />
              {digits ? "Enviar por WhatsApp" : "Partilhar no WhatsApp"}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {preset ? (
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {KIND_LABELS[preset.kind]} ·{" "}
                </span>
                <span className="font-medium">{preset.name}</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="intake-kind">Tipo</Label>
                  <select
                    id="intake-kind"
                    className={selectClass}
                    value={kind}
                    onChange={(event) => {
                      setKind(event.target.value as IntakeKind);
                      setDemoId("");
                    }}
                  >
                    <option value="convite">Convite</option>
                    <option value="save-the-date">Save the Date</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="intake-demo">Modelo</Label>
                  <select
                    id="intake-demo"
                    className={selectClass}
                    value={demoId}
                    onChange={(event) => setDemoId(event.target.value)}
                  >
                    <option value="">Escolha um modelo…</option>
                    {kindDemos.map((demo) => (
                      <option key={demo.id} value={demo.id}>
                        {demo.name}
                      </option>
                    ))}
                  </select>
                  {kindDemos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Não há modelos demo deste tipo.
                    </p>
                  ) : null}
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="intake-name">Nome do cliente (opcional)</Label>
              <Input
                id="intake-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="intake-phone">WhatsApp (opcional)</Label>
              <div className="flex gap-2">
                <select
                  aria-label="Indicativo"
                  className={cn(selectClass, "w-28 shrink-0")}
                  value={prefix}
                  onChange={(event) => setPrefix(event.target.value)}
                >
                  {COUNTRY_CODES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {`${option.flag} ${option.code}`}
                    </option>
                  ))}
                </select>
                <Input
                  id="intake-phone"
                  type="tel"
                  inputMode="tel"
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                  maxLength={20}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {created ? (
            <Link
              href={getIntakePath(created.id)}
              onClick={() => handleOpenChange(false)}
              className={buttonVariants({ variant: "outline" })}
            >
              Ver formulário
            </Link>
          ) : (
            <Button onClick={handleCreate} disabled={creating || !selectedDemo}>
              {creating ? "A criar…" : "Criar link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
