"use client";

import { useEffect, useRef } from "react";
import { Loader2, Send, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ChatItem =
  | { kind: "user"; id: string; text: string }
  | { kind: "assistant"; id: string; text: string; costUsd?: number | null }
  | { kind: "activity"; id: string; text: string }
  | { kind: "error"; id: string; text: string };

export default function ChatPane({
  items,
  prompt,
  onPromptChange,
  onSubmit,
  building,
}: {
  items: ChatItem[];
  prompt: string;
  onPromptChange: (v: string) => void;
  onSubmit: () => void;
  building: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ScrollArea className="min-h-0 flex-1 rounded-lg border p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Describe the invitation you want. The agent writes real code, then
            you preview it before publishing.
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
              if (m.kind === "error") {
                return (
                  <p
                    key={m.id}
                    className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {m.text}
                  </p>
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
                      "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {m.text}
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
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={3}
          disabled={building}
          placeholder="e.g. An editorial art-deco invitation in deep emerald and gold…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘↵ to send</span>
          <Button onClick={onSubmit} disabled={building || !prompt.trim()}>
            {building ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Building…
              </>
            ) : (
              <>
                <Send className="size-4" /> Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
