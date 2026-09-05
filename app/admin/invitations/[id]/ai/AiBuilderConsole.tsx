"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { BuildEvent, BuildUsage } from "@/worker/lib/build-events";
import type { Critique } from "@/worker/lib/critique";
import type { AttachmentRecord } from "@/worker/persistence";
import { parseSseFrames } from "@/lib/ai-build-stream";
import { formatElapsed } from "@/lib/ai-build-elapsed";
import {
  AI_PREVIEW_CAPTURE,
  AI_PREVIEW_CAPTURED,
  AI_PREVIEW_READY,
  MAX_TILES,
  type CaptureResult,
} from "@/lib/ai-preview-capture";
import { classifyBuildError, isFatalAgentText } from "@/lib/build-errors";
import ChatPane, { type ChatItem } from "./ChatPane";
import PreviewPane from "./PreviewPane";
import VersionsPane, { type Revision } from "./VersionsPane";

let seq = 0;
const nextId = () => `c${++seq}`;

/** Cards persisted before the review went phone-only stored `{ phone, desktop }`. */
function legacyScreenshots(
  value: string[] | { phone?: string[]; desktop?: string[] } | null | undefined,
): string[] {
  if (Array.isArray(value)) return value;
  return [...(value?.phone ?? []), ...(value?.desktop ?? [])];
}

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
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  // Id of the assistant bubble currently being streamed into, if any. A ref,
  // not state: it is read and written inside the async stream loop.
  const streamingId = useRef<string | null>(null);
  // The SDK sends `result` (with the token numbers) AFTER the final assistant
  // message, so remember which bubble was sealed last to stamp them onto.
  const lastSealedId = useRef<string | null>(null);
  // Visual critique: the console captures the preview iframe after a first
  // build and sends the tiles for review. Bounded to one round per prompt.
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const critiqueRounds = useRef(0);
  const MAX_CRITIQUE_ROUNDS = 1;
  // True while tiles are being captured or judged; drives the manual button.
  const [reviewing, setReviewing] = useState(false);
  // Set while a build is applying a critique, so its draft can be labelled.
  const applyingCritique = useRef(false);
  // Build progress + reconnect. `buildStartedAt` drives the elapsed timer;
  // `sawTerminal` distinguishes a clean end from a dropped stream; the poller
  // re-attaches to a build still running server-side after a reload/blip.
  const [buildStartedAt, setBuildStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const sawTerminal = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const setBubbleUsage = (id: string, usage: BuildUsage | null) =>
    setItems((prev) =>
      prev.map((it) =>
        it.kind === "assistant" && it.id === id ? { ...it, usage } : it,
      ),
    );

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
      (current) =>
        current ?? list.find((r) => r.active)?.id ?? list[0]?.id ?? null,
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
        usage: unknown;
        critique: unknown;
        attachments?: AttachmentRecord[];
      }>;
    };
    setItems(
      messages.map((m): ChatItem => {
        if (m.role === "user") {
          return {
            kind: "user",
            id: m.id,
            text: m.content,
            attachments: m.attachments ?? [],
          };
        }
        const c = m.critique as
          | {
              score: number;
              verdict: "ship" | "revise";
              issues: Critique["issues"];
              screenshots: string[];
            }
          | null
          | undefined;
        if (c && typeof c.score === "number") {
          return {
            kind: "critique",
            id: m.id,
            score: c.score,
            verdict: c.verdict,
            issues: c.issues ?? [],
            screenshots: legacyScreenshots(c.screenshots),
          };
        }
        return {
          kind: "assistant",
          id: m.id,
          text: m.content,
          costUsd: m.costUsd,
          usage: (m.usage as BuildUsage | null) ?? null,
        };
      }),
    );
  }, [slug]);

  const loadAttachments = useCallback(async () => {
    const res = await fetch(
      `/api/admin/ai/attachments?slug=${encodeURIComponent(slug)}&pending=1`,
    );
    if (res.ok) setAttachments((await res.json()).attachments ?? []);
  }, [slug]);

  // Tick the elapsed timer once a second while a build runs.
  useEffect(() => {
    if (!building || buildStartedAt == null) {
      setElapsedMs(0);
      return;
    }
    const tick = () => setElapsedMs(Date.now() - buildStartedAt);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [building, buildStartedAt]);

  const finishBuild = useCallback(() => {
    setBuilding(false);
    setBuildStartedAt(null);
    void refreshRail();
    void loadAttachments();
  }, [refreshRail, loadAttachments]);

  /** Is a build for this invitation still running on the server? */
  const isBuildRunning = useCallback(async (): Promise<number | null> => {
    try {
      const res = await fetch(
        `/api/admin/ai/builds/status?slug=${encodeURIComponent(slug)}`,
      );
      if (!res.ok) return null;
      const st = (await res.json()) as { running?: boolean; startedAt?: number };
      return st.running ? (st.startedAt ?? Date.now()) : null;
    } catch {
      return null;
    }
  }, [slug]);

  /** Re-attach to a build running server-side: show progress, refresh on end. */
  const enterReconnect = useCallback(
    (startedAt: number) => {
      setBuilding(true);
      setBuildStartedAt(startedAt);
      if (reconnectTimer.current) return;
      reconnectTimer.current = setInterval(async () => {
        const running = await isBuildRunning();
        if (running != null) {
          setBuildStartedAt(running);
          return;
        }
        if (reconnectTimer.current) clearInterval(reconnectTimer.current);
        reconnectTimer.current = null;
        await loadHistory();
        finishBuild();
      }, 3000);
    },
    [isBuildRunning, loadHistory, finishBuild],
  );

  const cancelBuild = useCallback(async () => {
    try {
      await fetch("/api/admin/ai/builds/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
    } catch {
      // best effort — the stream/poller will settle the UI either way
    }
  }, [slug]);

  useEffect(() => {
    void loadHistory();
    void refreshRail();
    void loadAttachments();
    // If a build is already running (reload mid-build), re-attach to it.
    void isBuildRunning().then((startedAt) => {
      if (startedAt != null) enterReconnect(startedAt);
    });
    return () => {
      if (reconnectTimer.current) clearInterval(reconnectTimer.current);
    };
  }, [loadHistory, refreshRail, loadAttachments, isBuildRunning, enterReconnect]);

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
    // A terminal event means the build ended in-band; a stream that ends
    // WITHOUT one of these is a dropped connection, not a finished build.
    if (e.kind === "draft" || e.kind === "error" || e.kind === "question") {
      sawTerminal.current = true;
    }
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
          lastSealedId.current = id;
        } else {
          const fresh = nextId();
          lastSealedId.current = fresh;
          append({ kind: "assistant", id: fresh, text: e.text });
        }
        break;
      }
      case "result":
        // No error card here — the worker emits a specific `error` (or salvages
        // a draft). This event's job is the token numbers.
        if (lastSealedId.current) setBubbleUsage(lastSealedId.current, e.usage);
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
        if (applyingCritique.current) {
          applyingCritique.current = false;
          append({
            kind: "activity",
            id: nextId(),
            text: "Correções aplicadas ao rascunho.",
          });
        }
        toast.success("Rascunho pronto — pré-visualize e depois publique.");
        if (e.firstBuild) void runCritique(e.revisionId);
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

  /** Resolve when the preview iframe reports the bundle has mounted. */
  const waitForPreviewReady = (timeoutMs = 45_000) =>
    new Promise<boolean>((resolve) => {
      const origin = window.location.origin;
      const cleanup = () => {
        clearTimeout(timer);
        window.removeEventListener("message", onMsg);
      };
      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);
      const onMsg = (e: MessageEvent) => {
        if (e.origin !== origin || e.data?.type !== AI_PREVIEW_READY) return;
        cleanup();
        resolve(true);
      };
      window.addEventListener("message", onMsg);
    });

  /** Ask the bridge inside the iframe for tiles at the current width. */
  const captureTiles = (maxTiles: number, timeoutMs = 60_000) =>
    new Promise<{ tiles: string[]; error?: string }>((resolve) => {
      const win = iframeRef.current?.contentWindow;
      if (!win)
        return resolve({ tiles: [], error: "preview frame not mounted" });
      const origin = window.location.origin;
      const requestId = `cap-${Date.now()}`;
      const cleanup = () => {
        clearTimeout(timer);
        window.removeEventListener("message", onMsg);
      };
      const timer = setTimeout(() => {
        cleanup();
        resolve({ tiles: [], error: "the preview did not answer in time" });
      }, timeoutMs);
      const onMsg = (e: MessageEvent<CaptureResult>) => {
        if (
          e.origin !== origin ||
          e.data?.type !== AI_PREVIEW_CAPTURED ||
          e.data.requestId !== requestId
        ) {
          return;
        }
        cleanup();
        resolve({ tiles: e.data.tiles ?? [], error: e.data.error });
      };
      window.addEventListener("message", onMsg);
      win.postMessage(
        { type: AI_PREVIEW_CAPTURE, requestId, maxTiles },
        origin,
      );
    });

  const runCritique = async (
    revisionId: string,
    opts?: { manual?: boolean },
  ) => {
    if (process.env.NEXT_PUBLIC_AI_CRITIQUE === "off") return;
    // The automatic round is bounded; an explicit request from the admin is not.
    if (!opts?.manual && critiqueRounds.current >= MAX_CRITIQUE_ROUNDS) return;
    if (reviewing || building) return;
    critiqueRounds.current += 1;
    setReviewing(true);
    try {
      await critiqueOnce(revisionId, opts?.manual === true);
    } finally {
      setReviewing(false);
    }
  };

  const critiqueOnce = async (revisionId: string, manual: boolean) => {
    append({
      kind: "activity",
      id: nextId(),
      text: "A capturar o resultado renderizado…",
    });

    // After a draft event the nonce was bumped, so the iframe is reloading and
    // READY tells us when it has mounted. A manual run captures the frame as it
    // stands; the bridge re-checks the mount on each request anyway.
    if (!manual) await waitForPreviewReady();
    // Phone only: that is how guests open an invitation, and the console's
    // "desktop" is a narrow column that would only mislead the reviewer.
    const before = device;
    setDevice("phone");
    const phone = await captureTiles(MAX_TILES);
    const width = iframeRef.current?.clientWidth ?? 0;
    setDevice(before);

    const shots = phone.tiles.map((dataUrl) => ({ width, dataUrl }));
    if (shots.length === 0) {
      const reason = phone.error;
      append({
        kind: "activity",
        id: nextId(),
        text: reason
          ? `A captura falhou (${reason}) — revisão visual ignorada.`
          : "Captura vazia — revisão visual ignorada.",
      });
      return;
    }

    append({ kind: "activity", id: nextId(), text: "A analisar o resultado…" });
    const res = await fetch("/api/admin/ai/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        revisionId,
        shots,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      append({
        kind: "error",
        id: nextId(),
        text: "A revisão visual falhou.",
        detail: body.error,
      });
      return;
    }
    const { critique, screenshots } = (await res.json()) as {
      critique: Critique;
      screenshots: string[];
    };
    append({
      kind: "critique",
      id: nextId(),
      score: critique.score,
      verdict: critique.verdict,
      issues: critique.issues,
      screenshots,
    });

    if (critique.verdict === "revise" && critique.issues.length > 0) {
      await startBuild("Aplicar correções da revisão visual", { critique });
    }
  };

  const startBuild = async (
    text: string,
    opts?: {
      critique?: Critique;
    },
  ) => {
    const trimmed = text.trim();
    if (!trimmed || building) return;
    setBuilding(true);
    setBuildStartedAt(Date.now());
    sawTerminal.current = false;
    streamingId.current = null;
    applyingCritique.current = Boolean(opts?.critique);
    // A pick / another-round / critique reuses or labels its own turn — only a
    // fresh prompt echoes a user bubble, clears the tray, and re-arms the loop.
    if (!opts?.critique) {
      critiqueRounds.current = 0;
      // The tray belongs to this message now — show it in the bubble and clear
      // the composer, the same way any chat client behaves.
      append({
        kind: "user",
        id: nextId(),
        text: trimmed,
        attachments,
      });
      setAttachments([]);
      setPrompt("");
    }
    try {
      const res = await fetch("/api/admin/ai/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          prompt: trimmed,
          critique: opts?.critique,
        }),
      });
      if (res.status === 409) {
        append({
          kind: "error",
          id: nextId(),
          text: "Já existe uma construção em curso para este convite.",
        });
        return;
      }
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
      // Stream closed. If it ended without a terminal event and the worker is
      // still running server-side, we were disconnected — reconnect instead of
      // declaring the build over.
      if (!sawTerminal.current) {
        const startedAt = await isBuildRunning();
        if (startedAt != null) {
          enterReconnect(startedAt);
          return;
        }
      }
    } catch {
      // Network drop mid-stream. The worker child survives, so re-attach if it
      // is still running rather than showing a connection error.
      const startedAt = await isBuildRunning();
      if (startedAt != null) {
        enterReconnect(startedAt);
        return;
      }
      append({ kind: "error", id: nextId(), text: "Erro na ligação." });
    }
    finishBuild();
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
      const res = await fetch(
        `/api/admin/ai/revisions/${revisionId}/activate`,
        {
          method: "POST",
        },
      );
      const body = await res.json();
      if (res.ok) toast.success("Reposto — já está ativo.");
      else toast.error(body.error ?? "Falha ao repor.");
      await refreshRail();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (revisionId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ai/revisions/${revisionId}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (res.ok) {
        toast.success(
          body.sessionReset
            ? "Versão removida. A próxima alteração parte da versão anterior."
            : "Versão removida.",
        );
        // The pane was showing the deleted version: let the rail refresh
        // re-seed it with what is live, or the newest that remains.
        if (previewRevisionId === revisionId) setPreviewRevisionId(null);
      } else {
        toast.error(body.error ?? "Falha ao remover.");
      }
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
        elapsedMs={elapsedMs}
        onCancel={cancelBuild}
        onCritique={() => {
          if (previewRevisionId)
            void runCritique(previewRevisionId, { manual: true });
        }}
        canCritique={previewRevisionId != null}
        reviewing={reviewing}
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
        iframeRef={iframeRef}
      />
      <VersionsPane
        revisions={revisions}
        busy={busy}
        onPreview={showPreview}
        onPublish={publish}
        onActivate={activate}
        onRemove={remove}
      />
    </div>
  );
}
