"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  Eye,
  FileText,
  HelpCircle,
  Loader2,
  Send,
  Wrench,
} from "lucide-react";

import type { BuildUsage } from "@/worker/lib/build-events";
import type { Critique } from "@/worker/lib/critique";
import type { AttachmentRecord } from "@/worker/persistence";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ChatMarkdown from "./ChatMarkdown";
import AttachmentPicker from "./AttachmentPicker";

export type ChatItem =
  | { kind: "user"; id: string; text: string; attachments?: AttachmentRecord[] }
  | {
      kind: "assistant";
      id: string;
      text: string;
      costUsd?: number | null;
      usage?: BuildUsage | null;
    }
  | { kind: "activity"; id: string; text: string }
  | { kind: "question"; id: string; text: string }
  | {
      kind: "critique";
      id: string;
      score: number;
      verdict: "ship" | "revise";
      issues: Critique["issues"];
      screenshots: string[];
    }
  | {
      kind: "error";
      id: string;
      text: string;
      hint?: string;
      detail?: string;
    };

/** "41k in (95% cache) · 9k out · opus" — enough to see caching working. */
function formatUsage(u: BuildUsage): string {
  const k = (n: number) => `${Math.round(n / 1000)}k`;
  const totalIn = u.inputTokens + u.cacheReadTokens + u.cacheWriteTokens;
  const cachePct = totalIn
    ? Math.round((u.cacheReadTokens / totalIn) * 100)
    : 0;
  const model = u.model.includes("opus")
    ? "opus"
    : u.model.includes("sonnet")
      ? "sonnet"
      : u.model;
  return `${k(totalIn)} in (${cachePct}% cache) · ${k(u.outputTokens)} out · ${model}`;
}

/**
 * ⌘↵ / Ctrl↵ do not insert a newline on their own, so put one at the caret.
 * `execCommand` keeps the undo stack and fires `input` (so React's onChange
 * runs); the fallback writes the value directly and restores the caret.
 */
function insertLineBreak(
  el: HTMLTextAreaElement,
  onChange: (value: string) => void,
) {
  if (document.execCommand?.("insertText", false, "\n")) return;
  const { selectionStart, selectionEnd, value } = el;
  const next =
    value.slice(0, selectionStart) + "\n" + value.slice(selectionEnd);
  onChange(next);
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = selectionStart + 1;
  });
}

export default function ChatPane({
  items,
  prompt,
  onPromptChange,
  onSubmit,
  building,
  onCritique,
  canCritique,
  reviewing,
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
  /** Capture the current draft and ask for a visual review, on demand. */
  onCritique: () => void;
  canCritique: boolean;
  reviewing: boolean;
  slug: string;
  attachments: AttachmentRecord[];
  onAttach: (a: AttachmentRecord) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  // Streaming grows the last bubble's text without changing the item count, so
  // the length alone is not enough to keep the view pinned to the bottom.
  const lastItem = items[items.length - 1];
  const streamKey = lastItem && "text" in lastItem ? lastItem.text.length : 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length, streamKey]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ScrollArea className="min-h-0 flex-1 rounded-lg border p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Descreva o convite que pretende. O agente escreve código real e pode
            pré-visualizar antes de publicar.
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
              if (m.kind === "critique") {
                const thumbs = m.screenshots.slice(0, 2);
                return (
                  <div key={m.id} className="rounded-lg border px-3 py-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Eye className="size-4" /> Revisão visual
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          m.verdict === "ship"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {m.score}/10 ·{" "}
                        {m.verdict === "ship" ? "aprovado" : "a corrigir"}
                      </span>
                    </div>
                    {thumbs.length > 0 && (
                      <div className="mb-2 flex gap-2">
                        {thumbs.map((src) => (
                          <a
                            key={src}
                            href={src}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              className="h-24 rounded border object-cover object-top"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {m.issues.length > 0 && (
                      <ol className="list-decimal space-y-1 pl-4 text-xs">
                        {m.issues.map((i, n) => (
                          <li key={n}>
                            <span className="font-medium">{i.what}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              — {i.fix}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
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
                    {m.kind === "user" && m.attachments?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.attachments.map((a) =>
                          a.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={a.id}
                              src={a.url}
                              alt={a.name}
                              title={a.name}
                              className="size-16 rounded-md border border-primary-foreground/25 object-cover"
                            />
                          ) : (
                            <span
                              key={a.id}
                              className="flex items-center gap-1 rounded-md border border-primary-foreground/25 px-2 py-1 text-xs"
                            >
                              <FileText className="size-3 shrink-0" />
                              <span className="max-w-[9rem] truncate">
                                {a.name}
                              </span>
                            </span>
                          ),
                        )}
                      </div>
                    ) : null}
                    {m.kind === "assistant" &&
                      (m.costUsd != null || m.usage) && (
                        <span className="mt-1 block text-xs opacity-60">
                          {m.costUsd != null
                            ? `$${m.costUsd.toFixed(4)}`
                            : null}
                          {m.usage ? ` · ${formatUsage(m.usage)}` : null}
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
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            if (e.shiftKey) return; // the browser inserts the line break
            e.preventDefault();
            if (e.metaKey || e.ctrlKey) {
              insertLineBreak(e.currentTarget, onPromptChange);
              return;
            }
            onSubmit();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            ↵ para enviar · ⌘↵ nova linha
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onCritique}
              disabled={!canCritique || building || reviewing}
              title="Captura a pré-visualização e pede uma revisão visual"
            >
              {reviewing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Eye className="size-4" />
              )}
              Revisão visual
            </Button>
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
    </div>
  );
}
