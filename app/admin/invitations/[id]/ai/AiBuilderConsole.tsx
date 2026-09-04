"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { BuildEvent } from "@/worker/lib/build-events";
import type { Direction } from "@/worker/lib/directions";
import type { AttachmentRecord } from "@/worker/persistence";
import { parseSseFrames } from "@/lib/ai-build-stream";
import { classifyBuildError, isFatalAgentText } from "@/lib/build-errors";
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
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  // Id of the assistant bubble currently being streamed into, if any. A ref,
  // not state: it is read and written inside the async stream loop.
  const streamingId = useRef<string | null>(null);

  /** Replace the text of one assistant bubble. */
  const setBubbleText = (id: string, next: (prev: string) => string) =>
    setItems((prev) =>
      prev.map((it) =>
        it.kind === "assistant" && it.id === id
          ? { ...it, text: next(it.text) }
          : it,
      ),
    );

  const append = (item: ChatItem) =>
    setItems((prev) => {
      // One failure often reaches us twice — as fatal assistant prose and again
      // on stderr. Don't stack identical cards.
      const last = prev[prev.length - 1];
      if (
        item.kind === "error" &&
        last?.kind === "error" &&
        last.text === item.text
      ) {
        return prev;
      }
      return [...prev, item];
    });

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

  const loadAttachments = useCallback(async () => {
    const res = await fetch(
      `/api/admin/ai/attachments?slug=${encodeURIComponent(slug)}`,
    );
    if (res.ok) setAttachments((await res.json()).attachments ?? []);
  }, [slug]);

  useEffect(() => {
    void loadHistory();
    void refreshRail();
    void loadAttachments();
  }, [loadHistory, refreshRail, loadAttachments]);

  const removeAttachment = async (id: string) => {
    const res = await fetch(`/api/admin/ai/attachments?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) setAttachments((prev) => prev.filter((a) => a.id !== id));
    else toast.error("Falha ao remover o ficheiro.");
  };

  const showPreview = (revisionId: string) => {
    setPreviewRevisionId(revisionId);
    setPreviewNonce((n) => n + 1);
  };

  const handleEvent = (e: BuildEvent) => {
    switch (e.kind) {
      case "tool":
        // A tool call ends the current prose block.
        streamingId.current = null;
        append({ kind: "activity", id: nextId(), text: e.label });
        break;
      case "delta": {
        const id = streamingId.current;
        if (id) {
          setBubbleText(id, (prev) => prev + e.text);
        } else {
          const fresh = nextId();
          streamingId.current = fresh;
          append({ kind: "assistant", id: fresh, text: e.text });
        }
        break;
      }
      case "progress": {
        const id = streamingId.current;
        // The SDK reports some fatal problems as ordinary assistant prose
        // ("Credit balance is too low"). Render those as errors, not replies.
        if (isFatalAgentText(e.text)) {
          if (id) {
            setItems((prev) => prev.filter((it) => it.id !== id));
            streamingId.current = null;
          }
          const info = classifyBuildError(e.text);
          append({
            kind: "error",
            id: nextId(),
            text: info.title,
            hint: info.hint,
            detail: info.detail,
          });
          break;
        }
        // The complete message — authoritative. Seal the streamed bubble with
        // it rather than appending a duplicate.
        if (id) {
          setBubbleText(id, () => e.text);
          streamingId.current = null;
        } else {
          append({ kind: "assistant", id: nextId(), text: e.text });
        }
        break;
      }
      case "result":
        // Deliberately silent: the worker emits a specific `error` (or salvages
        // a draft). Adding a generic failure here stacked a second card.
        break;
      case "directions":
        append({ kind: "directions", id: nextId(), directions: e.directions });
        break;
      case "question":
        // The agent could not tell what an attachment was for and asked instead
        // of guessing. Replying in the composer resumes the same session.
        streamingId.current = null;
        append({ kind: "question", id: nextId(), text: e.text });
        toast.info("O agente precisa de uma resposta.");
        break;
      case "draft":
        showPreview(e.revisionId);
        toast.success("Rascunho pronto — pré-visualize e depois publique.");
        break;
      case "error":
        append({
          kind: "error",
          id: nextId(),
          text: e.message,
          hint: e.hint,
          detail: e.detail,
        });
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
    streamingId.current = null;
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
          text: `O pedido de construção falhou (${res.status}).`,
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
        text: err instanceof Error ? err.message : "Erro na ligação.",
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
      if (res.ok) toast.success("Publicado — já está ativo.");
      else toast.error(body.error ?? "Falha ao publicar.");
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
      if (res.ok) toast.success("Reposto — já está ativo.");
      else toast.error(body.error ?? "Falha ao repor.");
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
        slug={slug}
        attachments={attachments}
        onAttach={(a) => setAttachments((prev) => [...prev, a])}
        onRemoveAttachment={removeAttachment}
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
