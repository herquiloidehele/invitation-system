"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Check,
  ClipboardCopy,
  Copy,
  ExternalLink,
  Factory,
  MessageCircle,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getIntakesPath } from "@/lib/admin-row-navigation";
import { INTAKE_STATUS_LABELS, type IntakeAnswerSection } from "@/lib/intake/answers";
import type { IntakeKind } from "@/lib/intake/catalog";
import {
  buildAdminInviteMessage,
  buildCustomerWhatsappUrl,
} from "@/lib/intake/links";
import { cn } from "@/lib/utils";
import { statusBadgeVariant } from "../IntakesClient";

export interface IntakeDetail {
  id: string;
  reference: string;
  kind: IntakeKind;
  status: string;
  source: string;
  demoName: string;
  demoSlug: string;
  demoExists: boolean;
  demoImageUrl: string | null;
  contactName: string;
  contactWhatsapp: string;
  createdAt: string;
  submittedAt: string | null;
  answersUpdatedAt: string | null;
  url: string;
  createdHref: string | null;
}

type Section = Omit<IntakeAnswerSection, "rows"> & {
  rows: Array<IntakeAnswerSection["rows"][number] & { changed: boolean }>;
};

const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function IntakeDetailClient({
  intake,
  sections,
  plainText,
}: {
  intake: IntakeDetail;
  sections: Section[];
  plainText: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const productLabel = intake.kind === "save-the-date" ? "Save the Date" : "convite";
  const canApply =
    intake.demoExists &&
    (intake.status === "draft" || intake.status === "submitted");

  // Record the visit once; the "Alterado" markers stay for this page view.
  useEffect(() => {
    void fetch(`/api/admin/intakes/${intake.id}/viewed`, { method: "POST" });
  }, [intake.id]);

  async function patchStatus(status: string, success: string) {
    setBusy(status);
    try {
      const response = await fetch(`/api/admin/intakes/${intake.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      toast.success(success);
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar o estado.");
    } finally {
      setBusy(null);
    }
  }

  async function apply() {
    setBusy("apply");
    try {
      const response = await fetch(`/api/admin/intakes/${intake.id}/apply`, {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body.message ?? "Não foi possível criar a partir das respostas.");
        return;
      }
      toast.success(`${intake.kind === "save-the-date" ? "Save the Date" : "Convite"} criado.`);
      router.push(body.editPath);
    } catch {
      toast.error("Sem ligação ao servidor.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    try {
      const response = await fetch(`/api/admin/intakes/${intake.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      toast.success("Formulário eliminado.");
      router.push(getIntakesPath());
      router.refresh();
    } catch {
      toast.error("Não foi possível eliminar.");
      setBusy(null);
    }
  }

  async function copy(text: string, message: string, onCopied?: () => void) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
      onCopied?.();
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  const inviteMessage = buildAdminInviteMessage({
    name: intake.contactName,
    demoName: intake.demoName,
    url: intake.url,
  });
  const sendLinkHref = intake.contactWhatsapp
    ? buildCustomerWhatsappUrl(intake.contactWhatsapp, inviteMessage)
    : `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-3">
        <Link
          href={getIntakesPath()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Formulários
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {intake.contactName || "Cliente sem nome"}
              </h1>
              <Badge variant={statusBadgeVariant(intake.status)}>
                {INTAKE_STATUS_LABELS[intake.status] ?? intake.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Ref. <span className="font-mono">{intake.reference}</span> ·{" "}
              {intake.source === "self" ? "Iniciado pelo cliente" : "Criado pelo admin"} ·
              Criado {formatDateTime(intake.createdAt)}
              {intake.submittedAt ? ` · Submetido ${formatDateTime(intake.submittedAt)}` : ""}
            </p>
          </div>
          {intake.contactWhatsapp ? (
            <a
              href={buildCustomerWhatsappUrl(intake.contactWhatsapp, "")}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <MessageCircle className="size-4 text-emerald-600" />+{intake.contactWhatsapp}
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {intake.status === "draft" ? (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              O cliente ainda não submeteu. As respostas abaixo são um rascunho e
              vão sendo guardadas enquanto preenche.
            </div>
          ) : null}

          {sections.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ainda não há respostas.
              </CardContent>
            </Card>
          ) : (
            sections.map((section) => (
              <Card key={section.stepId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y">
                    {section.rows.map((row, index) => (
                      <div
                        key={`${row.key}-${index}`}
                        className="grid gap-1 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4"
                      >
                        <dt className="flex items-start gap-2 text-sm text-muted-foreground">
                          {row.label}
                          {row.changed ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                              Alterado
                            </Badge>
                          ) : null}
                        </dt>
                        <dd className="whitespace-pre-line break-words text-sm">
                          <SwatchText value={row.value} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ações</CardTitle>
              <CardDescription>
                {intake.createdHref
                  ? `O ${productLabel} deste cliente já foi criado.`
                  : `Cria o ${productLabel} do cliente a partir do modelo, já com as respostas.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {intake.createdHref ? (
                <Link
                  href={intake.createdHref}
                  className={cn(buttonVariants({ variant: "default" }), "w-full")}
                >
                  <ExternalLink className="size-4" />
                  Abrir {productLabel} criado
                </Link>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button className="w-full" disabled={!canApply || busy !== null} />
                    }
                  >
                    <Sparkles className="size-4" />
                    {busy === "apply" ? "A criar…" : `Criar ${productLabel} com as respostas`}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Criar {productLabel}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {intake.status === "draft"
                          ? "O cliente ainda não submeteu o formulário. "
                          : ""}
                        Será criada uma cópia do modelo {intake.demoName} com as
                        respostas do cliente, e o formulário passa a “Em produção”
                        (o cliente deixa de poder alterar).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={apply}>Criar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {!intake.demoExists && !intake.createdHref ? (
                <p className="text-xs text-destructive">
                  O modelo {intake.demoName} já não existe. Crie o {productLabel} manualmente.
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {intake.status !== "in_production" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => patchStatus("in_production", "Marcado em produção.")}
                  >
                    <Factory className="size-3.5" />
                    Em produção
                  </Button>
                ) : null}
                {intake.status !== "archived" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => patchStatus("archived", "Formulário arquivado.")}
                  >
                    <Archive className="size-3.5" />
                    Arquivar
                  </Button>
                ) : null}
                {intake.status === "in_production" || intake.status === "archived" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() =>
                      patchStatus(
                        intake.submittedAt ? "submitted" : "draft",
                        "Formulário reaberto. O cliente pode voltar a editar.",
                      )
                    }
                  >
                    <RotateCcw className="size-3.5" />
                    Reabrir
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copy(plainText, "Respostas copiadas.")}
                >
                  <ClipboardCopy className="size-3.5" />
                  Copiar respostas
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Link do cliente</CardTitle>
              <CardDescription>
                O cliente pode voltar a este link para continuar ou alterar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={intake.url}
                  className="h-8 font-mono text-xs"
                  onClick={(event) => (event.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() =>
                    copy(intake.url, "Link copiado!", () => {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    })
                  }
                >
                  {copiedLink ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Copiar
                </Button>
              </div>
              <a
                href={sendLinkHref}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
              >
                <MessageCircle className="size-3.5" />
                Enviar link por WhatsApp
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Modelo escolhido</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {intake.demoImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail from S3
                  <img src={intake.demoImageUrl} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{intake.demoName}</p>
                <p className="text-xs text-muted-foreground">
                  {intake.kind === "save-the-date" ? "Save the Date" : "Convite"}
                </p>
              </div>
              {intake.demoExists ? (
                <a
                  href={intake.kind === "save-the-date" ? `/s/${intake.demoSlug}` : `/${intake.demoSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  title="Ver modelo"
                >
                  <ExternalLink className="size-4" />
                </a>
              ) : null}
            </CardContent>
          </Card>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={busy !== null}
                />
              }
            >
              <Trash2 className="size-4" />
              Eliminar formulário
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar formulário?</AlertDialogTitle>
                <AlertDialogDescription>
                  As respostas são apagadas e o link do cliente deixa de funcionar.
                  {intake.createdHref ? ` O ${productLabel} já criado não é afetado.` : ""}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={remove} className="bg-destructive/10 text-destructive">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

/** Renders "#rrggbb" tokens with a small swatch next to them. */
function SwatchText({ value }: { value: string }) {
  const parts = value.split(/(#[0-9a-fA-F]{6})/g);
  return (
    <>
      {parts.map((part, index) =>
        /^#[0-9a-fA-F]{6}$/.test(part) ? (
          <span key={index} className="inline-flex items-center gap-1 align-middle">
            <span
              className="inline-block size-3.5 rounded-full border border-black/10"
              style={{ background: part }}
            />
            <span className="font-mono text-xs">{part}</span>
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
