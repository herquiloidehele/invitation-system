"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Heart,
  Users,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Trash2,
  Search,
  Plus,
  ChevronDown,
  Scroll,
  Link2,
  Sparkles,
  CopyPlus,
  Ban,
  LockOpen,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InvitationListResult } from "@/lib/admin-list/invitations";
import { ListPagination } from "@/components/admin/ListPagination";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import {
  getInvitationDuplicatePath,
  getInvitationEditPath,
} from "@/lib/admin-row-navigation";
import { BlockInvitationDialog } from "./BlockInvitationDialog";
import {
  CreateIntakeDialog,
  type IntakeDemoOption,
} from "@/components/admin/CreateIntakeDialog";

export function InvitationsClient({
  rows,
  pagination,
  params,
  tabCounts,
  stats,
  themes,
}: InvitationListResult) {
  const router = useRouter();
  const list = useListUrlState({
    pathname: "/admin/invitations",
    params: {
      tab: params.tab,
      q: params.q,
      template: params.template,
      page: params.page,
    },
    defaults: { tab: "real" },
  });
  const refreshList = list.refresh;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [blockDialogFor, setBlockDialogFor] = useState<{
    id: string;
    coupleName: string;
  } | null>(null);
  const [intakeDialogFor, setIntakeDialogFor] =
    useState<IntakeDemoOption | null>(null);

  // Same formula as before, now from the global totals.
  const confirmationRate =
    stats.total > 0 ? ((stats.totalRsvps / stats.total) * 100).toFixed(1) : "0";

  const templateItems = [
    { value: "all", label: "Todos os modelos" },
    ...themes.map((theme) => ({ value: theme.name, label: theme.label })),
  ];

  const handleDelete = useCallback(
    async (id: string, coupleName: string) => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/admin/invitations/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Falha ao eliminar");
        }
        toast.success(`Convite de ${coupleName} eliminado.`);
        refreshList();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Erro ao eliminar convite. Tente novamente.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [refreshList],
  );

  const handleSetBlocked = useCallback(
    async (id: string, coupleName: string, blocked: boolean, reason = "") => {
      setBlockingId(id);
      try {
        const res = await fetch(`/api/admin/invitations/${id}/block`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocked, reason }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Falha ao atualizar o bloqueio");
        }
        setBlockDialogFor(null);
        toast.success(
          blocked
            ? `Convite de ${coupleName} bloqueado.`
            : `Convite de ${coupleName} desbloqueado.`,
        );
        refreshList();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Erro ao atualizar o bloqueio. Tente novamente.",
        );
      } finally {
        setBlockingId(null);
      }
    },
    [refreshList],
  );

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const openInvitation = (id: string, renderMode?: string | null) => {
    router.push(getInvitationEditPath(id, renderMode));
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    id: string,
    renderMode?: string | null,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openInvitation(id, renderMode);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Convites
            </CardTitle>
            <Heart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Convites criados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RSVP Ativo</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.rsvpEnabled}
            </div>
            <p className="text-xs text-muted-foreground">
              Com confirmação aberta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Confirmações
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRsvps}</div>
            <p className="text-xs text-muted-foreground">Respostas recebidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Confirmação
            </CardTitle>
            <Heart className="size-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmationRate}%</div>
            <p className="text-xs text-muted-foreground">Média por convite</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Todos os Convites</CardTitle>
              <CardDescription>
                Gerir, editar e acompanhar todos os convites de casamento
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="sm">
                    <Plus className="size-4 mr-1.5" />
                    Criar Convite
                    <ChevronDown className="size-3.5 ml-1.5 opacity-70" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() => router.push("/admin/invitations/new")}
                >
                  <Scroll className="size-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Interno</p>
                    <p className="text-xs text-muted-foreground">
                      Convite completo com todas as secções
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/admin/invitations/new-external")}
                >
                  <Link2 className="size-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Externo</p>
                    <p className="text-xs text-muted-foreground">
                      Capa + vídeo ou link externo
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/admin/invitations/new-ai")}
                >
                  <Sparkles className="size-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">IA</p>
                    <p className="text-xs text-muted-foreground">
                      Design gerado por IA a partir de um pedido
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs
            value={params.tab}
            onValueChange={(value) => list.setParam("tab", String(value))}
          >
            <TabsList>
              <TabsTrigger value="real">Real ({tabCounts.real})</TabsTrigger>
              <TabsTrigger value="demo">Demo ({tabCounts.demo})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Pesquisar por casal ou slug..."
                value={list.searchText}
                onChange={(e) => list.setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              items={templateItems}
              value={params.template || "all"}
              onValueChange={(v) =>
                list.setParam("template", !v || v === "all" ? null : String(v))
              }
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Todos os modelos" />
              </SelectTrigger>
              <SelectContent>
                {templateItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {rows.length === 0 ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              <Heart className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">
                {stats.total === 0
                  ? "Nenhum convite criado ainda"
                  : params.tab === "demo"
                    ? "Nenhum convite demo encontrado"
                    : "Nenhum convite real encontrado"}
              </p>
              <p className="text-sm mt-1">
                {stats.total === 0
                  ? "Crie o primeiro convite para começar."
                  : "Tente ajustar os filtros de pesquisa."}
              </p>
              {stats.total === 0 && (
                <Link
                  href="/admin/invitations/new"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "mt-4",
                  )}
                >
                  <Plus className="size-4 mr-1.5" />
                  Criar Convite
                </Link>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "border rounded-lg overflow-hidden transition-opacity",
                list.isPending && "opacity-60",
              )}
              aria-busy={list.isPending}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center">Confirmações</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-muted-foreground">
                      Criado em
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((inv) => {
                    const coupleName = buildInvitationDisplayName({
                      eventType: inv.eventType,
                      primaryName: inv.couple.bride,
                      secondaryName: inv.couple.groom,
                    });
                    const isExternal =
                      inv.invitationType === "external_video" ||
                      inv.invitationType === "external_link";
                    return (
                      <TableRow
                        key={inv.id}
                        role="link"
                        tabIndex={0}
                        className="cursor-pointer"
                        onClick={() => openInvitation(inv.id, inv.renderMode)}
                        onKeyDown={(event) =>
                          handleRowKeyDown(event, inv.id, inv.renderMode)
                        }
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {coupleName}
                          {inv.renderMode === "ai" && (
                            <Badge variant="secondary" className="ml-2">
                              AI
                            </Badge>
                          )}
                          {inv.blockedAt && (
                            <Badge
                              variant="destructive"
                              className="ml-2"
                              title={
                                inv.blockedReason ??
                                `Bloqueado em ${formatDate(inv.blockedAt)}`
                              }
                            >
                              Bloqueado
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {inv.slug}
                          </code>
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">
                            {inv.templateLabel}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {inv.date?.display ?? "—"}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {inv._count.rsvpResponses}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          {isExternal ? (
                            <Badge
                              variant="outline"
                              className="border-sky-500 text-sky-600 bg-sky-50 dark:bg-sky-950"
                            >
                              Externo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Interno
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(inv.createdAt)}
                        </TableCell>

                        <TableCell>
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Link
                              href={`/${inv.slug}`}
                              target="_blank"
                              className={cn(
                                buttonVariants({
                                  variant: "ghost",
                                  size: "icon",
                                }),
                                "size-8 text-muted-foreground",
                              )}
                              title="Ver convite"
                            >
                              <ExternalLink className="size-4" />
                              <span className="sr-only">Ver convite</span>
                            </Link>

                            <Link
                              href={`/admin/rsvps?invitation=${inv.slug}`}
                              className={cn(
                                buttonVariants({
                                  variant: "ghost",
                                  size: "icon",
                                }),
                                "size-8 text-muted-foreground",
                              )}
                              title="Ver confirmações"
                            >
                              <Users className="size-4" />
                              <span className="sr-only">Confirmações</span>
                            </Link>

                            {inv.isDemo && !inv.blockedAt ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground"
                                title="Criar formulário de cliente"
                                onClick={() =>
                                  setIntakeDialogFor({
                                    kind: "convite",
                                    id: inv.id,
                                    name: inv.landingModelName || coupleName,
                                  })
                                }
                              >
                                <ClipboardList className="size-4" />
                                <span className="sr-only">
                                  Criar formulário de cliente
                                </span>
                              </Button>
                            ) : null}

                            <Link
                              href={getInvitationDuplicatePath(inv.id)}
                              className={cn(
                                buttonVariants({
                                  variant: "ghost",
                                  size: "icon",
                                }),
                                "size-8 text-muted-foreground",
                              )}
                              title="Duplicar convite"
                            >
                              <CopyPlus className="size-4" />
                              <span className="sr-only">Duplicar convite</span>
                            </Link>

                            <Link
                              href={getInvitationEditPath(inv.id, inv.renderMode)}
                              className={cn(
                                buttonVariants({
                                  variant: "ghost",
                                  size: "icon",
                                }),
                                "size-8 text-muted-foreground",
                              )}
                              title="Editar convite"
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">Editar</span>
                            </Link>

                            {inv.blockedAt ? (
                              <AlertDialog>
                                <AlertDialogTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-destructive"
                                      disabled={blockingId === inv.id}
                                      title="Desbloquear convite"
                                    />
                                  }
                                >
                                  <LockOpen className="size-4" />
                                  <span className="sr-only">
                                    Desbloquear convite
                                  </span>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Desbloquear convite
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      O convite de <strong>{coupleName}</strong>{" "}
                                      voltará a estar acessível para convidados
                                      e anfitriões.
                                      {inv.blockedReason && (
                                        <>
                                          {" "}
                                          Motivo atual:{" "}
                                          <em>{inv.blockedReason}</em>.
                                        </>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleSetBlocked(
                                          inv.id,
                                          coupleName,
                                          false,
                                        )
                                      }
                                      disabled={blockingId === inv.id}
                                    >
                                      {blockingId === inv.id
                                        ? "A desbloquear..."
                                        : "Desbloquear"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                disabled={blockingId === inv.id}
                                title="Bloquear convite"
                                onClick={() =>
                                  setBlockDialogFor({ id: inv.id, coupleName })
                                }
                              >
                                <Ban className="size-4" />
                                <span className="sr-only">
                                  Bloquear convite
                                </span>
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-destructive"
                                    disabled={deletingId === inv.id}
                                  />
                                }
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Eliminar</span>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Eliminar Convite
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem a certeza que deseja eliminar o convite
                                    de <strong>{coupleName}</strong>? Esta ação
                                    não pode ser revertida e também eliminará
                                    todas as confirmações associadas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    variant="destructive"
                                    onClick={() =>
                                      handleDelete(inv.id, coupleName)
                                    }
                                    disabled={deletingId === inv.id}
                                  >
                                    {deletingId === inv.id
                                      ? "A eliminar..."
                                      : "Eliminar"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <ListPagination
            className="mt-3"
            pagination={pagination}
            hrefFor={(page) => list.hrefFor({ page })}
            onNavigate={list.navigate}
          />
        </CardContent>
      </Card>

      {intakeDialogFor ? (
        <CreateIntakeDialog
          key={intakeDialogFor.id}
          open
          onOpenChange={(open) => {
            if (!open) setIntakeDialogFor(null);
          }}
          preset={intakeDialogFor}
        />
      ) : null}

      <BlockInvitationDialog
        open={blockDialogFor !== null}
        onOpenChange={(open) => {
          if (!open) setBlockDialogFor(null);
        }}
        coupleName={blockDialogFor?.coupleName ?? ""}
        pending={
          blockDialogFor !== null && blockingId === blockDialogFor.id
        }
        onConfirm={(reason) => {
          if (blockDialogFor) {
            void handleSetBlocked(
              blockDialogFor.id,
              blockDialogFor.coupleName,
              true,
              reason,
            );
          }
        }}
      />
    </div>
  );
}
