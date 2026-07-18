"use client";

import { useState, useMemo, useCallback, type KeyboardEvent } from "react";
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
  CopyPlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InvitationRow } from "./page";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import {
  getInvitationDuplicatePath,
  getInvitationEditPath,
} from "@/lib/admin-row-navigation";

const TEMPLATE_LABELS: Record<string, string> = {
  "pink-floral": "Pink Floral",
  "modern-minimal": "Modern Minimal",
  "boho-chic": "Boho Chic",
  "midnight-elegance": "Midnight Elegance",
};

interface InvitationsClientProps {
  invitations: InvitationRow[];
}

export function InvitationsClient({
  invitations: initialInvitations,
}: InvitationsClientProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [demoTab, setDemoTab] = useState<"real" | "demo">("real");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Derived stats
  const totalRsvps = useMemo(
    () => invitations.reduce((sum, inv) => sum + inv._count.rsvpResponses, 0),
    [invitations],
  );
  const rsvpEnabled = useMemo(
    () => invitations.filter((inv) => inv.rsvp?.enabled).length,
    [invitations],
  );
  const confirmationRate = useMemo(
    () =>
      invitations.length > 0
        ? ((totalRsvps / Math.max(invitations.length, 1)) * 100).toFixed(1)
        : "0",
    [invitations, totalRsvps],
  );
  const realCount = useMemo(
    () => invitations.filter((inv) => !inv.isDemo).length,
    [invitations],
  );
  const demoCount = useMemo(
    () => invitations.filter((inv) => inv.isDemo).length,
    [invitations],
  );

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return invitations.filter((inv) => {
      const matchesDemoTab = demoTab === "demo" ? inv.isDemo : !inv.isDemo;
      const matchesSearch =
        !q ||
        inv.couple.bride.toLowerCase().includes(q) ||
        inv.couple.groom.toLowerCase().includes(q) ||
        inv.slug.toLowerCase().includes(q);
      const matchesTemplate =
        templateFilter === "all" || inv.template === templateFilter;
      return matchesDemoTab && matchesSearch && matchesTemplate;
    });
  }, [invitations, search, templateFilter, demoTab]);

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
        setInvitations((prev) => prev.filter((inv) => inv.id !== id));
        toast.success(`Convite de ${coupleName} eliminado.`);
        router.refresh();
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
    [router],
  );

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const openInvitation = (id: string) => {
    router.push(getInvitationEditPath(id));
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    id: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openInvitation(id);
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
            <div className="text-2xl font-bold">{invitations.length}</div>
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
              {rsvpEnabled}
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
            <div className="text-2xl font-bold">{totalRsvps}</div>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs
            value={demoTab}
            onValueChange={(value) => setDemoTab(value as "real" | "demo")}
          >
            <TabsList>
              <TabsTrigger value="real">Real ({realCount})</TabsTrigger>
              <TabsTrigger value="demo">Demo ({demoCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Pesquisar por casal ou slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={templateFilter}
              onValueChange={(v) => setTemplateFilter(v ?? "all")}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Todos os modelos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modelos</SelectItem>
                {Object.entries(TEMPLATE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              <Heart className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">
                {invitations.length === 0
                  ? "Nenhum convite criado ainda"
                  : demoTab === "demo"
                    ? "Nenhum convite demo encontrado"
                    : "Nenhum convite real encontrado"}
              </p>
              <p className="text-sm mt-1">
                {invitations.length === 0
                  ? "Crie o primeiro convite para começar."
                  : "Tente ajustar os filtros de pesquisa."}
              </p>
              {invitations.length === 0 && (
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
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center">Confirmações</TableHead>
                    <TableHead className="text-center">RSVP</TableHead>
                    <TableHead className="text-muted-foreground">
                      Criado em
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const coupleName = buildInvitationDisplayName({
                      eventType: inv.eventType,
                      primaryName: inv.couple.bride,
                      secondaryName: inv.couple.groom,
                    });
                    return (
                      <TableRow
                        key={inv.id}
                        role="link"
                        tabIndex={0}
                        className="cursor-pointer"
                        onClick={() => openInvitation(inv.id)}
                        onKeyDown={(event) => handleRowKeyDown(event, inv.id)}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {coupleName}
                        </TableCell>

                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {inv.slug}
                          </code>
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">
                            {TEMPLATE_LABELS[inv.template] ?? inv.template}
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
                          {inv.rsvp?.enabled ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                            >
                              Ativo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Inativo
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
                              href={getInvitationEditPath(inv.id)}
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

          {/* Results count when filtering */}
          {(search || templateFilter !== "all") && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {filtered.length} convite{filtered.length !== 1 ? "s" : ""} no
              separador {demoTab === "demo" ? "Demo" : "Real"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
