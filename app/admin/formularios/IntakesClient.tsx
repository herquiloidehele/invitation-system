"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, MessageCircle, Plus, Search } from "lucide-react";

import {
  CreateIntakeDialog,
  type IntakeDemoOption,
} from "@/components/admin/CreateIntakeDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIntakePath } from "@/lib/admin-row-navigation";
import { INTAKE_STATUS_LABELS } from "@/lib/intake/answers";
import { buildCustomerWhatsappUrl } from "@/lib/intake/links";
import type { IntakeListRow } from "./page";

type TabId = "new" | "submitted" | "draft" | "in_production" | "archived";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "new", label: "Novos" },
  { id: "submitted", label: "Submetidos" },
  { id: "draft", label: "Rascunhos" },
  { id: "in_production", label: "Em produção" },
  { id: "archived", label: "Arquivados" },
];

function matchesTab(row: IntakeListRow, tab: TabId): boolean {
  return tab === "new" ? row.unseen : row.status === tab;
}

export function statusBadgeVariant(status: string) {
  if (status === "submitted") return "default" as const;
  if (status === "in_production") return "secondary" as const;
  return "outline" as const;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function IntakesClient({
  rows,
  demos,
}: {
  rows: IntakeListRow[];
  demos: IntakeDemoOption[];
}) {
  const router = useRouter();
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [tab.id, rows.filter((row) => matchesTab(row, tab.id)).length]),
      ) as Record<TabId, number>,
    [rows],
  );
  const [tab, setTab] = useState<TabId>(counts.new > 0 ? "new" : "submitted");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-PT");
    return rows.filter((row) => {
      if (query) {
        return [row.contactName, row.contactWhatsapp, row.demoName, row.reference]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("pt-PT").includes(query));
      }
      return matchesTab(row, tab);
    });
  }, [rows, search, tab]);

  const open = (id: string) => router.push(getIntakePath(id));
  const onRowKey = (event: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Formulários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detalhes enviados pelos clientes para criar o convite.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Novo formulário
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)}>
          <TabsList>
            {TABS.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
                {counts[item.id] ? (
                  <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                    {counts[item.id]}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar cliente, número, modelo ou ref."
            className="pl-8"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Nenhum formulário aqui</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? "Tente outra pesquisa." : "Os formulários dos clientes aparecem aqui."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última alteração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => open(row.id)}
                  onKeyDown={(event) => onRowKey(event, row.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.unseen ? (
                        <span
                          className="size-2 shrink-0 rounded-full bg-primary"
                          title="Novo ou alterado"
                        />
                      ) : null}
                      <div>
                        <p className="font-medium">{row.contactName || "Sem nome"}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          Ref. {row.reference}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.contactWhatsapp ? (
                      <a
                        href={buildCustomerWhatsappUrl(row.contactWhatsapp, "")}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-sm hover:underline"
                      >
                        <MessageCircle className="size-3.5 text-emerald-600" />+
                        {row.contactWhatsapp}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{row.demoName}</span>
                      <Badge variant="outline">
                        {row.productKind === "save-the-date" ? "STD" : "Convite"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.source === "self" ? "Cliente" : "Admin"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(row.status)}>
                      {INTAKE_STATUS_LABELS[row.status] ?? row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(row.lastActivity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateIntakeDialog open={createOpen} onOpenChange={setCreateOpen} demos={demos} />
    </div>
  );
}
