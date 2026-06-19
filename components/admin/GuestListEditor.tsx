"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GuestForm from "./GuestForm";
import GuestRowActions from "./GuestRowActions";
import type { GuestData, GuestUpsertInput } from "@/lib/types";

interface GuestListEditorProps {
  /** Path used for list (GET) and create (POST). E.g. "/api/owner/<token>/guests" */
  apiBasePath: string;
  /** Used to construct per-guest paths: `${apiBasePath}/${guestId}`. */
  invitationSlug: string;
  invitationOrigin: string;
  messageTemplate: string;
  /** Optional: shown in the header. */
  title?: string;
  showCustomExternalLink?: boolean;
  /** When false, hides the "add guest" affordances. Defaults to true — set false on the host page when `ownerCanAddGuests` is off. */
  canAddGuests?: boolean;
}

export default function GuestListEditor({
  apiBasePath,
  invitationSlug,
  invitationOrigin,
  messageTemplate,
  title = "Convidados",
  showCustomExternalLink = false,
  canAddGuests = true,
}: GuestListEditorProps) {
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GuestData | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuestData | null>(null);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBasePath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch guests");
      const data = await res.json();
      setGuests(data.guests as GuestData[]);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar a lista de convidados.");
    } finally {
      setLoading(false);
    }
  }, [apiBasePath]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.companion ?? "").toLowerCase().includes(q) ||
        (g.tableLabel ?? "").toLowerCase().includes(q),
    );
  }, [guests, search]);

  function openAdd() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(guest: GuestData) {
    setEditing(guest);
    setFormOpen(true);
  }

  async function handleSubmit(input: GuestUpsertInput) {
    setSaving(true);
    try {
      const url = editing ? `${apiBasePath}/${editing.id}` : apiBasePath;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao guardar convidado");
      }
      toast.success(editing ? "Convidado actualizado" : "Convidado adicionado");
      setFormOpen(false);
      await fetchGuests();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${apiBasePath}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao apagar convidado");
      toast.success("Convidado apagado");
      setDeleteTarget(null);
      await fetchGuests();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {guests.length} convidado{guests.length === 1 ? "" : "s"}
          </p>
        </div>
        {canAddGuests && (
          <Button type="button" onClick={openAdd}>
            <Plus className="mr-1 size-4" />
            Adicionar convidado
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Procurar por nome, acompanhante ou mesa…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          A carregar convidados…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <Users className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">
            {guests.length === 0
              ? "Nenhum convidado ainda"
              : "Nenhum convidado corresponde à pesquisa"}
          </p>
          {guests.length === 0 && canAddGuests && (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={openAdd}
            >
              <Plus className="mr-1 size-3.5" />
              Adicionar primeiro convidado
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {filtered.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{g.name}</span>
                  {g.companion && (
                    <span className="text-sm text-muted-foreground">
                      &amp; {g.companion}
                    </span>
                  )}
                  {g.canInviteOthers && (
                    <Badge variant="secondary" className="text-[10px]">
                      Pode convidar
                    </Badge>
                  )}
                  {g.invitedByName && (
                    <Badge variant="outline" className="text-[10px]">
                      Convidado por {g.invitedByName}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {g.tableLabel && <span>Mesa: {g.tableLabel}</span>}
                  {g.phoneNumber && (
                    <span className="font-mono">
                      {g.phoneCountryCode} {g.phoneNumber}
                    </span>
                  )}
                  {g.note && (
                    <span className="italic">&ldquo;{g.note}&rdquo;</span>
                  )}
                </div>
              </div>
              <GuestRowActions
                guest={g}
                invitationSlug={invitationSlug}
                invitationOrigin={invitationOrigin}
                messageTemplate={messageTemplate}
                onEdit={openEdit}
                onDelete={(target) => setDeleteTarget(target)}
              />
            </li>
          ))}
        </ul>
      )}

      <GuestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        guest={editing}
        onSubmit={handleSubmit}
        saving={saving}
        showCustomExternalLink={showCustomExternalLink}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar convidado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção apaga {deleteTarget?.name} da lista. As confirmações já
              recebidas mantêm-se mas deixam de estar associadas a este
              convidado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
