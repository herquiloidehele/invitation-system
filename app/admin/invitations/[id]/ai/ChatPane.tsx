"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, HelpCircle, Loader2, Send, Wrench } from "lucide-react";

import type { Direction } from "@/worker/lib/directions";
import type { AttachmentRecord } from "@/worker/persistence";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import DirectionsCards from "./DirectionsCards";
import ChatMarkdown from "./ChatMarkdown";
import AttachmentPicker from "./AttachmentPicker";

export type ChatItem =
  | { kind: "user"; id: string; text: string }
  | { kind: "assistant"; id: string; text: string; costUsd?: number | null }
  | { kind: "activity"; id: string; text: string }
  | { kind: "directions"; id: string; directions: Direction[] }
  | { kind: "question"; id: string; text: string }
  | {
      kind: "error";
      id: string;
      text: string;
      hint?: string;
      detail?: string;
    };

export default function ChatPane({
  items,
  prompt,
  onPromptChange,
  onSubmit,
  building,
  onPickDirection,
  onAnotherRound,
  slug,
  attachments,
  onAttach,
  onRemoveAttachment,
}: {
  items: ChatItem[];
  prompt: string;
  onPromptChange: (v: string) => void;
  onSubmit: () => void;
  building: boolean;
  onPickDirection: (d: Direction) => void;
  onAnotherRound: (note: string) => void;
  slug: string;
  attachments: AttachmentRecord[];
  onAttach: (a: AttachmentRecord) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  // Streaming grows the last bubble's text without changing the item count, so
  // the length alone is not enough to keep the view pinned to the bottom.
  const lastItem = items[items.length - 1];
  const streamKey =
    lastItem && "text" in lastItem ? lastItem.text.length : 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length, streamKey]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ScrollArea className="min-h-0 flex-1 rounded-lg border p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Descreva o convite que pretende. O agente escreve código real e
            pode pré-visualizar antes de publicar.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((m) => {
              if (m.kind === "activity") {
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Wrench className="size-3 shrink-0" />
                    <span className="truncate">{m.text}</span>
                  </div>
                );
              }
              if (m.kind === "directions") {
                return (
                  <DirectionsCards
                    key={m.id}
                    directions={m.directions}
                    disabled={building}
                    onPick={onPickDirection}
                    onAnotherRound={onAnotherRound}
                  />
                );
              }
              if (m.kind === "question") {
                return (
                  <div
                    key={m.id}
                    className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1 text-sm">
                        <ChatMarkdown>{m.text}</ChatMarkdown>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Responda abaixo para continuar.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              if (m.kind === "error") {
                return (
                  <div
                    key={m.id}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-destructive">
                          {m.text}
                        </p>
                        {m.hint && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {m.hint}
                          </p>
                        )}
                        {m.detail && m.detail !== m.text && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              Detalhes técnicos
                            </summary>
                            <pre className="mt-1 max-h-40 overflow-auto rounded bg-foreground/5 p-2 font-mono text-[11px] whitespace-pre-wrap break-all">
                              {m.detail}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              const isUser = m.kind === "user";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      isUser
                        ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {isUser ? m.text : <ChatMarkdown>{m.text}</ChatMarkdown>}
                    {m.kind === "assistant" && m.costUsd != null && (
                      <span className="mt-1 block text-xs opacity-60">
                        ${m.costUsd.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </ScrollArea>

      <div className="space-y-2">
        <AttachmentPicker
          slug={slug}
          attachments={attachments}
          onAttach={onAttach}
          onRemove={onRemoveAttachment}
          disabled={building}
        />
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={3}
          disabled={building}
          placeholder="ex.: um convite editorial art déco em esmeralda e ouro…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘↵ para enviar</span>
          <Button onClick={onSubmit} disabled={building || !prompt.trim()}>
            {building ? (
              <>
                <Loader2 className="size-4 animate-spin" /> A construir…
              </>
            ) : (
              <>
                <Send className="size-4" /> Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
