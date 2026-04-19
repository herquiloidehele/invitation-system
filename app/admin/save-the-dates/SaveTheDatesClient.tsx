"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button-variants";
import { ExternalLink, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SaveTheDateRow } from "./page";

interface Props {
  items: SaveTheDateRow[];
}

export function SaveTheDatesClient({ items: initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.couple.bride.toLowerCase().includes(q) ||
        i.couple.groom.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/save-the-date/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Save the Date eliminado com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro ao eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Save the Date</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} save the date{items.length !== 1 ? "s" : ""} criado
            {items.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <Link
          href="/admin/save-the-dates/new"
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          <Plus className="size-4" />
          Novo Save the Date
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nomes ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Casal</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum save the date encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.couple.bride} & {item.couple.groom}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.themeName}</Badge>
                  </TableCell>
                  <TableCell>{item.date.display}</TableCell>
                  <TableCell>{fmt(item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/s/${item.slug}`}
                        target="_blank"
                        className={cn(
                          buttonVariants({
                            variant: "ghost",
                            size: "icon",
                          }),
                        )}
                        title="Ver"
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                      {item.rsvpEnabled && (
                        <Link
                          href={`/confirmacoes/${item.ownerToken}`}
                          target="_blank"
                          className={cn(
                            buttonVariants({
                              variant: "ghost",
                              size: "icon",
                            }),
                          )}
                          title="Ver confirmações"
                        >
                          <Users className="size-4" />
                        </Link>
                      )}
                      <Link
                        href={`/admin/save-the-dates/${item.id}/edit`}
                        className={cn(
                          buttonVariants({
                            variant: "ghost",
                            size: "icon",
                          }),
                        )}
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={deletingId === item.id}
                            />
                          }
                        >
                          <Trash2 className="size-4" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Eliminar Save the Date?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é irreversível. O save the date de{" "}
                              <strong>
                                {item.couple.bride} & {item.couple.groom}
                              </strong>{" "}
                              será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
