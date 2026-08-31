"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { BuildEvent } from "@/worker/lib/build-events";
import type { Direction } from "@/worker/lib/directions";
import { parseSseFrames } from "@/lib/ai-build-stream";
import ChatPane, { type ChatItem } from "./ChatPane";
import PreviewPane from "./PreviewPane";
import VersionsPane, { type Revision } from "./VersionsPane";

let seq = 0;
const nextId = () => `c${++seq}`;

export default function AiBuilderConsole({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [building, setBuilding] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [busy, setBusy] = useState(false);
  const [previewRevisionId, setPreviewRevisionId] = useState<string | null>(
    null,
  );
  const [previewNonce, setPreviewNonce] = useState(0);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  // The prompt that opened the directions gate, so picking a card (or asking
  // for another round) can rebuild with the original brief.
  const [gatePrompt, setGatePrompt] = useState("");

  const append = (item: ChatItem) => setItems((prev) => [...prev, item]);

  const refreshRail = useCallback(async () => {
    const res = await fetch(
      `/api/admin/ai/revisions?slug=${encodeURIComponent(slug)}`,
    );
    if (!res.ok) return;
    const list: Revision[] = (await res.json()).revisions ?? [];
    setRevisions(list);
    // Seed the preview with whatever is live, falling back to the newest
    // revision — otherwise an invitation with only drafts opens to an empty
    // pane even though there is something to look at.
    setPreviewRevisionId(
      (current) => current ?? list.find((r) => r.active)?.id ?? list[0]?.id ?? null,
    );
  }, [slug]);

  const loadHistory = useCallback(async () => {
    const res = await fetch(
      `/api/admin/ai/messages?slug=${encodeURIComponent(slug)}`,
    );
    if (!res.ok) return;
    const { messages } = (await res.json()) as {
      messages: Array<{
        id: string;
        role: string;
        content: string;
        costUsd: number | null;
        directions: unknown;
      }>;
    };
    setItems(
      messages.map((m): ChatItem => {
        if (m.role === "user") {
          return { kind: "user", id: m.id, text: m.content };
        }
        if (Array.isArray(m.directions) && m.directions.length > 0) {
          return {
            kind: "directions",
            id: m.id,
            directions: m.directions as Direction[],
          };
        }
        return {
          kind: "assistant",
          id: m.id,
          text: m.content,
          costUsd: m.costUsd,
        };
      }),
    );
    // Re-arm the gate prompt so a pick after a reload still has its brief.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) setGatePrompt(lastUser.content);
  }, [slug]);

  useEffect(() => {
    void loadHistory();
    void refreshRail();
  }, [loadHistory, refreshRail]);

  const showPreview = (revisionId: string) => {
    setPreviewRevisionId(revisionId);
    setPreviewNonce((n) => n + 1);
  };

  const handleEvent = (e: BuildEvent) => {
    switch (e.kind) {
      case "tool":
        append({ kind: "activity", id: nextId(), text: e.name });
        break;
      case "progress":
        append({ kind: "assistant", id: nextId(), text: e.text });
        break;
      case "result":
        if (!e.ok) {
          append({ kind: "error", id: nextId(), text: "Build failed." });
        }
        break;
      case "directions":
        append({ kind: "directions", id: nextId(), directions: e.directions });
        break;
      case "draft":
        showPreview(e.revisionId);
        toast.success("Draft ready — preview it, then publish.");
        break;
      case "error":
        append({ kind: "error", id: nextId(), text: e.message });
        break;
    }
  };

  const startBuild = async (
    text: string,
    opts?: { direction?: Direction; refineDirections?: string },
  ) => {
    const trimmed = text.trim();
    if (!trimmed || building) return;
    setBuilding(true);
    // A pick / another-round reuses the original prompt, so don't echo it again.
    if (!opts?.direction && !opts?.refineDirections) {
      append({ kind: "user", id: nextId(), text: trimmed });
      setGatePrompt(trimmed);
      setPrompt("");
    }
    try {
      const res = await fetch("/api/admin/ai/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          prompt: trimmed,
          direction: opts?.direction,
          refineDirections: opts?.refineDirections,
        }),
      });
      if (!res.ok || !res.body) {
        append({
          kind: "error",
          id: nextId(),
          text: `Build request failed (${res.status}).`,
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSseFrames(buffer);
        buffer = rest;
        for (const e of events) handleEvent(e);
      }
    } catch (err) {
      append({
        kind: "error",
        id: nextId(),
        text: err instanceof Error ? err.message : "Stream error.",
      });
    } finally {
      setBuilding(false);
      void refreshRail();
    }
  };

  const publish = async (revisionId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ai/revisions/${revisionId}/publish`, {
        method: "POST",
      });
      const body = await res.json();
      if (res.ok) toast.success("Published — now live.");
      else toast.error(body.error ?? "Publish failed.");
      await refreshRail();
    } finally {
      setBusy(false);
    }
  };

  const activate = async (revisionId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ai/revisions/${revisionId}/activate`, {
        method: "POST",
      });
      const body = await res.json();
      if (res.ok) toast.success("Restored — now live.");
      else toast.error(body.error ?? "Restore failed.");
      await refreshRail();
    } finally {
      setBusy(false);
    }
  };

  const previewSrc =
    previewRevisionId != null
      ? `/${locale}/${slug}?revision=${previewRevisionId}&_=${previewNonce}`
      : null;

  return (
    <div className="grid h-[calc(100vh-11rem)] min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,9fr)_minmax(0,5fr)]">
      <ChatPane
        items={items}
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={() => startBuild(prompt)}
        building={building}
        onPickDirection={(d) => startBuild(gatePrompt, { direction: d })}
        onAnotherRound={(note) =>
          startBuild(gatePrompt, { refineDirections: note || "different" })
        }
      />
      <PreviewPane
        src={previewSrc}
        device={device}
        onDeviceChange={setDevice}
        onReload={() => setPreviewNonce((n) => n + 1)}
      />
      <VersionsPane
        revisions={revisions}
        busy={busy}
        onPreview={showPreview}
        onPublish={publish}
        onActivate={activate}
      />
    </div>
  );
}
