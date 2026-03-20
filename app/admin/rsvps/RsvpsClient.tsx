"use client";

import { useState, useTransition, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, CheckCircle2, XCircle, Heart } from "lucide-react";
import { toast } from "sonner";
import type { InvitationSummary, RsvpResponseWithInvitation } from "./page";

interface RsvpsClientProps {
  invitations: InvitationSummary[];
  responses: RsvpResponseWithInvitation[];
  selectedSlug: string | null;
}

export function RsvpsClient({
  invitations,
  responses: initialResponses,
  selectedSlug,
}: RsvpsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [responses, setResponses] = useState(initialResponses);

  const totalAttending = responses.filter((r) => r.attending).length;
  const totalDeclined = responses.filter((r) => !r.attending).length;

  const handleFilterChange = useCallback(
    (value: string | null) => {
      const slug = value === "all" || !value ? null : value;
      startTransition(() => {
        const params = new URLSearchParams();
        if (slug) params.set("invitation", slug);
        router.push(`/admin/rsvps${params.size ? `?${params}` : ""}`);
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Respostas
            </CardTitle>
            <Heart className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedSlug ? `Para ${selectedSlug}` : "Todos os convites"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {totalAttending}
            </div>
            <p className="text-xs text-muted-foreground">
              {responses.length > 0
                ? `${Math.round((totalAttending / responses.length) * 100)}% do total`
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
            <div className="text-2xl font-bold text-rose-600">
              {totalDeclined}
            </div>
            <p className="text-xs text-muted-foreground">
              {responses.length > 0
                ? `${Math.round((totalDeclined / responses.length) * 100)}% do total`
                : "Sem respostas"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Confirmações</CardTitle>
              <CardDescription>
                Todas as respostas recebidas dos convidados
              </CardDescription>
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
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              <Users className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Sem confirmações ainda</p>
              <p className="text-sm mt-1">
                {selectedSlug
                  ? "Este convite ainda não tem respostas."
                  : "Nenhum convidado respondeu ainda."}
              </p>
            </div>
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
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.guestName}</div>
                        {r.email && (
                          <div className="text-xs text-muted-foreground">
                            {r.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {r.invitation.couple.bride} &amp;{" "}
                          {r.invitation.couple.groom}
                        </div>
                        <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                          {r.invitationSlug}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        {r.attending ? (
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
                        )}
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
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
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
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(r.submittedAt)}
                      </TableCell>
                      <TableCell>
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
                              <AlertDialogTitle>
                                Eliminar confirmação?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                A resposta de <strong>{r.guestName}</strong>{" "}
                                será permanentemente removida. Esta ação não
                                pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(r.id, r.guestName)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
