"use client";

import { CheckCircle2, Eye, RotateCcw, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Revision = {
  id: string;
  prompt: string | null;
  label: string | null;
  createdAt: string;
  published: boolean;
  active: boolean;
};

export default function VersionsPane({
  revisions,
  busy,
  onPreview,
  onPublish,
  onActivate,
}: {
  revisions: Revision[];
  busy: boolean;
  onPreview: (id: string) => void;
  onPublish: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <h2 className="text-sm font-medium">Versões</h2>
      <ScrollArea className="min-h-0 flex-1 rounded-lg border p-3">
        {revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há versões.</p>
        ) : (
          <ul className="space-y-2">
            {revisions.map((r) => (
              <li key={r.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-xs text-foreground">
                    {r.label || r.prompt || "(sem pedido)"}
                  </p>
                  {r.active ? (
                    <Badge className="shrink-0 gap-1">
                      <CheckCircle2 className="size-3" /> Ativa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      {r.published ? "Publicada" : "Rascunho"}
                    </Badge>
                  )}
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onPreview(r.id)}
                  >
                    <Eye className="size-3" /> Pré-ver
                  </Button>
                  {!r.published && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => onPublish(r.id)}
                    >
                      <Upload className="size-3" /> Publicar
                    </Button>
                  )}
                  {r.published && !r.active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => onActivate(r.id)}
                    >
                      <RotateCcw className="size-3" /> Repor
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
