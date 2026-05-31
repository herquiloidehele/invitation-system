"use client";

import { useState, useTransition, useCallback, type KeyboardEvent } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, CheckCircle2, XCircle, Heart, CalendarHeart } from "lucide-react";
import { toast } from "sonner";
import {
  getInvitationRsvpPath,
  getSaveTheDateRsvpPath,
} from "@/lib/admin-row-navigation";
import type {
  InvitationSummary,
  RsvpResponseWithInvitation,
  SaveDateSummary,
  StdRsvpResponseWithSaveDate,
} from "./page";

interface RsvpsClientProps {
  invitations: InvitationSummary[];
  responses: RsvpResponseWithInvitation[];
  selectedSlug: string | null;
  saveDates: SaveDateSummary[];
  stdResponses: StdRsvpResponseWithSaveDate[];
  selectedStdSlug: string | null;
  activeTab: "invitations" | "std";
}

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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border rounded-lg p-12 text-center text-muted-foreground">
      <Users className="size-10 mx-auto mb-3 opacity-30" />
      <p className="text-lg font-medium">Sem confirmações ainda</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invitations tab
// ---------------------------------------------------------------------------

function InvitationsTab({
  invitations,
  responses: initialResponses,
  selectedSlug,
}: {
  invitations: InvitationSummary[];
  responses: RsvpResponseWithInvitation[];
  selectedSlug: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [responses, setResponses] = useState(initialResponses);

  const totalAttending = responses.filter((r) => r.attending).length;
  const totalDeclined = responses.filter((r) => !r.attending).length;

  const handleFilterChange = useCallback(
    (value: string | null) => {
      const slug = !value || value === "all" ? null : value;
      startTransition(() => {
        const params = new URLSearchParams();
        params.set("tab", "invitations");
        if (slug) params.set("invitation", slug);
        router.push(`/admin/rsvps?${params}`);
      });
    },
    [router],
  );

  const handleDelete = useCallback(async (id: string, guestName: string) => {
    try {
      const res = await fetch(`/api/admin/rsvps/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setResponses((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Confirmação de "${guestName}" eliminada.`);
    } catch {
      toast.error("Erro ao eliminar confirmação. Tente novamente.");
    }
  }, []);

  const openInvitationResponses = (slug: string) => {
    router.push(getInvitationRsvpPath(slug));
  };

  const handleInvitationRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    slug: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openInvitationResponses(slug);
    }
  };

  return (
    <div className="space-y-4">
      <StatsBar
        total={responses.length}
        attending={totalAttending}
        declined={totalDeclined}
        filterLabel={selectedSlug ? `Para ${selectedSlug}` : "Todos os convites"}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Confirmações</CardTitle>
              <CardDescription>Todas as respostas recebidas dos convidados</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={selectedSlug ?? "all"}
                onValueChange={handleFilterChange}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por convite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os convites</SelectItem>
                  {invitations.map((inv) => (
                    <SelectItem key={inv.slug} value={inv.slug}>
                      {inv.couple.bride} &amp; {inv.couple.groom} (
                      {inv._count.rsvpResponses})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <EmptyState
              message={
                selectedSlug
                  ? "Este convite ainda não tem respostas."
                  : "Nenhum convidado respondeu ainda."
              }
            />
          ) : (
            <div className="border rounded-lg overflow-hidden">
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
                    <TableRow
                      key={r.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer"
                      onClick={() => openInvitationResponses(r.invitationSlug)}
                      onKeyDown={(event) =>
                        handleInvitationRowKeyDown(event, r.invitationSlug)
                      }
                    >
                      <TableCell>
                        <div className="font-medium">{r.guestName}</div>
                        {r.email && (
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {r.invitation.couple.bride} &amp; {r.invitation.couple.groom}
                        </div>
                        <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                          {r.invitationSlug}
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
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(r.submittedAt)}
                      </TableCell>
                      <TableCell
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
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
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save the Date tab
// ---------------------------------------------------------------------------

function SaveTheDateTab({
  saveDates,
  stdResponses: initialResponses,
  selectedStdSlug,
}: {
  saveDates: SaveDateSummary[];
  stdResponses: StdRsvpResponseWithSaveDate[];
  selectedStdSlug: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [responses, setResponses] = useState(initialResponses);

  const totalAttending = responses.filter((r) => r.attending).length;
  const totalDeclined = responses.filter((r) => !r.attending).length;

  const handleFilterChange = useCallback(
    (value: string | null) => {
      const slug = !value || value === "all" ? null : value;
      startTransition(() => {
        const params = new URLSearchParams();
        params.set("tab", "std");
        if (slug) params.set("std", slug);
        router.push(`/admin/rsvps?${params}`);
      });
    },
    [router],
  );

  const handleDelete = useCallback(async (id: string, guestName: string) => {
    try {
      const res = await fetch(`/api/admin/save-the-date/rsvps/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setResponses((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Confirmação de "${guestName}" eliminada.`);
    } catch {
      toast.error("Erro ao eliminar confirmação. Tente novamente.");
    }
  }, []);

  const openSaveTheDateResponses = (slug: string) => {
    router.push(getSaveTheDateRsvpPath(slug));
  };

  const handleSaveTheDateRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    slug: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSaveTheDateResponses(slug);
    }
  };

  return (
    <div className="space-y-4">
      <StatsBar
        total={responses.length}
        attending={totalAttending}
        declined={totalDeclined}
        filterLabel={selectedStdSlug ? `Para ${selectedStdSlug}` : "Todos os Save the Dates"}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Confirmações — Save the Date</CardTitle>
              <CardDescription>Todas as respostas recebidas dos convidados</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={selectedStdSlug ?? "all"}
                onValueChange={handleFilterChange}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por Save the Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Save the Dates</SelectItem>
                  {saveDates.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>
                      {s.couple.bride} &amp; {s.couple.groom} ({s._count.rsvpResponses})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <EmptyState
              message={
                selectedStdSlug
                  ? "Este Save the Date ainda não tem respostas."
                  : saveDates.length === 0
                    ? "Nenhum Save the Date tem confirmação de presença activada."
                    : "Nenhum convidado respondeu ainda."
              }
            />
          ) : (
            <div className="border rounded-lg overflow-hidden">
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
                    <TableRow
                      key={r.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer"
                      onClick={() => openSaveTheDateResponses(r.saveTheDateSlug)}
                      onKeyDown={(event) =>
                        handleSaveTheDateRowKeyDown(event, r.saveTheDateSlug)
                      }
                    >
                      <TableCell>
                        <div className="font-medium">{r.guestName}</div>
                        {r.email && (
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {r.saveTheDate.couple.bride} &amp; {r.saveTheDate.couple.groom}
                        </div>
                        <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                          {r.saveTheDateSlug}
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
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(r.submittedAt)}
                      </TableCell>
                      <TableCell
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
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
  invitations,
  responses,
  selectedSlug,
  saveDates,
  stdResponses,
  selectedStdSlug,
  activeTab,
}: RsvpsClientProps) {
  const router = useRouter();

  const handleTabChange = useCallback(
    (tab: string) => {
      router.push(`/admin/rsvps?tab=${tab}`);
    },
    [router],
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="invitations" className="gap-2">
          <Heart className="size-3.5" />
          Convites
        </TabsTrigger>
        <TabsTrigger value="std" className="gap-2">
          <CalendarHeart className="size-3.5" />
          Save the Date
          {stdResponses.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
              {stdResponses.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="invitations">
        <InvitationsTab
          invitations={invitations}
          responses={responses}
          selectedSlug={selectedSlug}
        />
      </TabsContent>

      <TabsContent value="std">
        <SaveTheDateTab
          saveDates={saveDates}
          stdResponses={stdResponses}
          selectedStdSlug={selectedStdSlug}
        />
      </TabsContent>
    </Tabs>
  );
}
