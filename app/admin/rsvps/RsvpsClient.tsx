"use client";

import { useTransition, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Heart,
  CalendarHeart,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInvitationRsvpPath,
  getSaveTheDateRsvpPath,
} from "@/lib/admin-row-navigation";
import { formatRsvpCustomAnswers } from "@/lib/rsvp-custom-fields";
import { cn } from "@/lib/utils";
import { ListPagination } from "@/components/admin/ListPagination";
import { RsvpTargetPicker } from "@/components/admin/RsvpTargetPicker";
import { useListUrlState } from "@/hooks/use-list-url-state";
import type { Pagination } from "@/lib/admin-list/params";
import type {
  InvitationRsvpTarget,
  RsvpPageResult,
  RsvpResponseRow,
  RsvpTargetOption,
} from "@/lib/admin-list/rsvps";

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ---------------------------------------------------------------------------
// Stats bar — shared between both tabs
// ---------------------------------------------------------------------------

function StatsBar({
  total,
  attending,
  declined,
  filterLabel,
}: {
  total: number;
  attending: number;
  declined: number;
  filterLabel: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
          <Heart className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">{filterLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
          <CheckCircle2 className="size-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{attending}</div>
          <p className="text-xs text-muted-foreground">
            {total > 0
              ? `${Math.round((attending / total) * 100)}% do total`
              : "Sem respostas"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recusados</CardTitle>
          <XCircle className="size-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600">{declined}</div>
          <p className="text-xs text-muted-foreground">
            {total > 0
              ? `${Math.round((declined / total) * 100)}% do total`
              : "Sem respostas"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attendance badge — shared
// ---------------------------------------------------------------------------

function AttendingBadge({ attending }: { attending: boolean }) {
  return attending ? (
    <Badge
      variant="outline"
      className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950"
    >
      <CheckCircle2 className="size-3 mr-1" />
      Confirma
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-rose-400 text-rose-600 bg-rose-50 dark:bg-rose-950"
    >
      <XCircle className="size-3 mr-1" />
      Não vai
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

/**
 * Per-message publish control for the guestbook.
 *
 * Only rendered when the host has turned the guestbook on for that invitation
 * — otherwise no RSVP message is public and there is nothing to hide. Writes
 * the response id into the invitation's `guestbook.hiddenResponseIds`.
 */
function GuestbookVisibilityToggle({
  responseId,
  invitation,
}: {
  responseId: string;
  invitation: InvitationRsvpTarget;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const guestbook = invitation.guestbook;

  if (guestbook?.enabled !== true) return null;

  const hidden = (guestbook.hiddenResponseIds ?? []).includes(responseId);

  async function toggle() {
    const current = guestbook?.hiddenResponseIds ?? [];
    const next = hidden
      ? current.filter((id) => id !== responseId)
      : [...current, responseId];
    try {
      const res = await fetch(
        `/api/admin/invitations/${invitation.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestbook: { ...guestbook, hiddenResponseIds: next },
          }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      toast.success(
        hidden ? "Mensagem visível no convite" : "Mensagem escondida do convite",
      );
      startTransition(() => router.refresh());
    } catch {
      toast.error("Não foi possível atualizar a mensagem");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-1 mt-1 text-muted-foreground"
      disabled={isPending}
      onClick={(event) => {
        event.stopPropagation();
        void toggle();
      }}
      title={
        hidden
          ? "Mostrar esta mensagem no livro de honra"
          : "Esconder esta mensagem do livro de honra"
      }
    >
      {hidden ? (
        <EyeOff className="h-3.5 w-3.5" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      <span className="text-xs ml-1">
        {hidden ? "Escondida" : "No livro de honra"}
      </span>
    </Button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border rounded-lg p-12 text-center text-muted-foreground">
      <Users className="size-10 mx-auto mb-3 opacity-30" />
      <p className="text-lg font-medium">Sem confirmações ainda</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}

function CustomAnswersBlock({ answers }: { answers: unknown }) {
  const formatted = formatRsvpCustomAnswers(answers);
  if (formatted.length === 0) return null;
  return (
    <div className="mt-2 space-y-1 rounded-md bg-muted/40 p-2 text-xs">
      <div className="font-medium text-muted-foreground">
        Respostas personalizadas
      </div>
      {formatted.map((answer) => (
        <div key={`${answer.label}-${answer.value}`}>
          <span className="font-medium">{answer.label}:</span>{" "}
          {answer.rows ? (
            <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
              {answer.rows.map((row, index) => (
                <li key={index}>{row}</li>
              ))}
            </ul>
          ) : (
            answer.value
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props shared by both tabs
// ---------------------------------------------------------------------------

interface TabProps {
  responses: RsvpResponseRow[];
  pagination: Pagination;
  stats: RsvpPageResult["stats"];
  /** A list navigation is in flight: dim the table. */
  isPending: boolean;
  hrefForPage: (page: number) => string;
  onNavigate: (href: string) => void;
  /** Re-reads the list after a delete, dimming the table meanwhile. */
  onRefresh: () => void;
}

// ---------------------------------------------------------------------------
// Invitations tab
// ---------------------------------------------------------------------------

function InvitationsTab({
  invitation,
  responses,
  pagination,
  stats,
  isPending,
  hrefForPage,
  onNavigate,
  onRefresh,
}: TabProps & { invitation: InvitationRsvpTarget | null }) {

  const handleDelete = useCallback(
    async (id: string, guestName: string) => {
      try {
        const res = await fetch(`/api/admin/rsvps/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed");
        toast.success(`Confirmação de "${guestName}" eliminada.`);
        onRefresh();
      } catch {
        toast.error("Erro ao eliminar confirmação. Tente novamente.");
      }
    },
    [onRefresh],
  );

  return (
    <div className="space-y-4">
      <StatsBar
        total={stats.total}
        attending={stats.attending}
        declined={stats.declined}
        filterLabel={invitation ? `Para ${invitation.slug}` : "Sem convites"}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Confirmações</CardTitle>
              <CardDescription>Todas as respostas recebidas dos convidados</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <RsvpTargetPicker
                key={invitation?.slug ?? "none"}
                kind="invitation"
                selected={invitation}
                onSelect={(slug) => onNavigate(getInvitationRsvpPath(slug))}
                placeholder="Filtrar por convite"
                disabled={isPending || invitation === null}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invitation === null || responses.length === 0 ? (
            <EmptyState
              message={
                invitation
                  ? "Este convite ainda não tem respostas."
                  : "Nenhum convidado respondeu ainda."
              }
            />
          ) : (
            <div
              className={cn(
                "border rounded-lg overflow-hidden transition-opacity",
                isPending && "opacity-60",
              )}
              aria-busy={isPending}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Convidado</TableHead>
                    <TableHead>Convite</TableHead>
                    <TableHead className="text-center">Resposta</TableHead>
                    <TableHead>Restrições Alimentares</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.guestName}</div>
                        {r.email && (
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {invitation.bride} &amp; {invitation.groom}
                        </div>
                        <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                          {invitation.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <AttendingBadge attending={r.attending} />
                      </TableCell>
                      <TableCell className="max-w-[160px]">
                        {r.dietaryRestrictions ? (
                          <span className="text-sm truncate block" title={r.dietaryRestrictions}>
                            {r.dietaryRestrictions}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {r.message ? (
                          <span
                            className="text-sm truncate block italic text-muted-foreground"
                            title={r.message}
                          >
                            &ldquo;{r.message}&rdquo;
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                        {r.message && (
                          <GuestbookVisibilityToggle
                            responseId={r.id}
                            invitation={invitation}
                          />
                        )}
                        <CustomAnswersBlock answers={r.customAnswers} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(r.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <DeleteButton
                          id={r.id}
                          guestName={r.guestName}
                          onDelete={handleDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <ListPagination
            className="mt-3"
            pagination={pagination}
            hrefFor={hrefForPage}
            onNavigate={onNavigate}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save the Date tab
// ---------------------------------------------------------------------------

function SaveTheDateTab({
  std,
  responses,
  pagination,
  stats,
  isPending,
  hrefForPage,
  onNavigate,
  onRefresh,
}: TabProps & { std: RsvpTargetOption | null }) {

  const handleDelete = useCallback(
    async (id: string, guestName: string) => {
      try {
        const res = await fetch(`/api/admin/save-the-date/rsvps/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed");
        toast.success(`Confirmação de "${guestName}" eliminada.`);
        onRefresh();
      } catch {
        toast.error("Erro ao eliminar confirmação. Tente novamente.");
      }
    },
    [onRefresh],
  );

  return (
    <div className="space-y-4">
      <StatsBar
        total={stats.total}
        attending={stats.attending}
        declined={stats.declined}
        filterLabel={std ? `Para ${std.slug}` : "Sem Save the Dates"}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Confirmações — Save the Date</CardTitle>
              <CardDescription>Todas as respostas recebidas dos convidados</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <RsvpTargetPicker
                key={std?.slug ?? "none"}
                kind="std"
                selected={std}
                onSelect={(slug) => onNavigate(getSaveTheDateRsvpPath(slug))}
                placeholder="Filtrar por Save the Date"
                disabled={isPending || std === null}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {std === null || responses.length === 0 ? (
            <EmptyState
              message={
                std
                  ? "Este Save the Date ainda não tem respostas."
                  : "Nenhum Save the Date tem confirmação de presença activada."
              }
            />
          ) : (
            <div
              className={cn(
                "border rounded-lg overflow-hidden transition-opacity",
                isPending && "opacity-60",
              )}
              aria-busy={isPending}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Convidado</TableHead>
                    <TableHead>Save the Date</TableHead>
                    <TableHead className="text-center">Resposta</TableHead>
                    <TableHead>Restrições Alimentares</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.guestName}</div>
                        {r.email && (
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {std.bride} &amp; {std.groom}
                        </div>
                        <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                          {std.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <AttendingBadge attending={r.attending} />
                      </TableCell>
                      <TableCell className="max-w-[160px]">
                        {r.dietaryRestrictions ? (
                          <span
                            className="text-sm truncate block"
                            title={r.dietaryRestrictions}
                          >
                            {r.dietaryRestrictions}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {r.message ? (
                          <span
                            className="text-sm truncate block italic text-muted-foreground"
                            title={r.message}
                          >
                            &ldquo;{r.message}&rdquo;
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                        <CustomAnswersBlock answers={r.customAnswers} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(r.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <DeleteButton
                          id={r.id}
                          guestName={r.guestName}
                          onDelete={handleDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <ListPagination
            className="mt-3"
            pagination={pagination}
            hrefFor={hrefForPage}
            onNavigate={onNavigate}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete button — shared
// ---------------------------------------------------------------------------

function DeleteButton({
  id,
  guestName,
  onDelete,
}: {
  id: string;
  guestName: string;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Eliminar</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar confirmação?</AlertDialogTitle>
          <AlertDialogDescription>
            A resposta de <strong>{guestName}</strong> será permanentemente
            removida. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(id, guestName)}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Root client component
// ---------------------------------------------------------------------------

export function RsvpsClient({
  params,
  invitation,
  std,
  responses,
  pagination,
  stats,
  stdResponseCount,
}: RsvpPageResult) {
  const list = useListUrlState({
    pathname: "/admin/rsvps",
    params:
      params.tab === "std"
        ? { tab: "std", std: std?.slug ?? null, page: params.page }
        : {
            tab: "invitations",
            invitation: invitation?.slug ?? null,
            page: params.page,
          },
  });

  // Each tab opens on its own selection; the invitations tab falls back to
  // the newest invitation when the URL names none.
  const handleTabChange = (tab: string) => {
    if (tab === "std") {
      list.navigate(std ? getSaveTheDateRsvpPath(std.slug) : "/admin/rsvps?tab=std");
    } else {
      list.navigate("/admin/rsvps?tab=invitations");
    }
  };

  const tabProps: TabProps = {
    responses,
    pagination,
    stats,
    isPending: list.isPending,
    hrefForPage: (page) => list.hrefFor({ page }),
    onNavigate: list.navigate,
    onRefresh: list.refresh,
  };

  return (
    <Tabs
      value={params.tab}
      onValueChange={(value) => handleTabChange(String(value))}
    >
      <TabsList className="mb-6">
        <TabsTrigger value="invitations" className="gap-2">
          <Heart className="size-3.5" />
          Convites
        </TabsTrigger>
        <TabsTrigger value="std" className="gap-2">
          <CalendarHeart className="size-3.5" />
          Save the Date
          {stdResponseCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
              {stdResponseCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Only the active tab has rows: the server loads one list per request. */}
      <TabsContent value="invitations">
        {params.tab === "invitations" ? (
          <InvitationsTab invitation={invitation} {...tabProps} />
        ) : null}
      </TabsContent>

      <TabsContent value="std">
        {params.tab === "std" ? (
          <SaveTheDateTab std={std} {...tabProps} />
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
