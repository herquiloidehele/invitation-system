import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { getObjectBuffer } from "@/lib/s3";
import { getInvitation } from "@/lib/invitations";
import { provisionWorkspace } from "./provision";
import { runBuildAgent } from "./agent";
import { bundleRegistersComponent } from "./lib/verify-bundle";
import { buildInvitationBrief } from "./lib/invitation-brief";
import { type BuildEvent, type BuildUsage, toBuildEvent } from "./lib/build-events";
import { classifyBuildError } from "@/lib/build-errors";
import { type Direction, directionToPrompt, proposeDirections } from "./lib/directions";
import { buildAttachmentBrief } from "./lib/attachment-brief";
import { collectSourceFiles, sourceFilesEqual } from "./lib/source-files";
import { buildSourceManifest } from "./lib/source-manifest";
import { type Critique, critiqueToPrompt } from "./lib/critique";
import { buildRecap, shouldRotateSession } from "./lib/session-rotation";
import { spendCapExceeded } from "./lib/spend-cap";
import {
  appendMessage,
  createDraftRevision,
  getOrCreateBuild,
  latestDraftRevisionId,
  latestRevisionSource,
  linkPendingAttachments,
  listAttachmentsForInvitation,
  listMessagesForInvitation,
  revisionCount,
  saveSessionId,
  sumCostForInvitation,
  updateDraftRevisionSource
} from "./persistence";

/** The directions gate is deliberately cheap — bound what it looks at. */
const MAX_GATE_IMAGES = 4;
const MAX_GATE_IMAGE_BYTES = 4 * 1024 * 1024;

/** Design is decided on the first build; tweaks are mechanical edits. */
function effortFor(isFirstBuild: boolean): "low" | "medium" | "high" {
  const env = isFirstBuild
    ? process.env.AI_BUILD_EFFORT_FIRST
    : process.env.AI_BUILD_EFFORT_TWEAK;
  if (env === "low" || env === "medium" || env === "high") return env;
  return isFirstBuild ? "high" : "low";
}

/**
 * The full build-and-publish flow, emitting typed events. Reused by the human
 * CLI and the NDJSON entry (which the admin SSE route spawns).
 */
export async function runInvitationBuild(args: {
  slug: string;
  prompt: string;
  /** Chosen direction — when set, the gate is skipped and this is built. */
  direction?: Direction | null;
  /** Ask for a fresh set of directions, optionally with a note. */
  refineDirections?: string | null;
  /** A visual review to apply: resumes the first build's session, fixes, updates the draft in place. */
  critique?: Critique | null;
  onEvent: (event: BuildEvent) => void;
}): Promise<{ ok: boolean }> {
  const { slug, prompt, direction, refineDirections, critique, onEvent } = args;
  const isCritiqueTurn = Boolean(critique);

  const invitation = await getInvitation(slug);
  if (!invitation) {
    onEvent({ kind: "error", message: `No invitation with slug "${slug}".` });
    return { ok: false };
  }
  const invRow = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  const invitationId = invRow!.id;

  const build = await getOrCreateBuild(invitationId);
  const userMessageId = await appendMessage({
    buildId: build.id,
    role: "user",
    // The critique prompt is long and machine-shaped; the thread shows a label.
    content: isCritiqueTurn
      ? `Aplicar correções da revisão visual (${critique!.issues.length} pontos)`
      : prompt,
  });
  if (isCritiqueTurn && !build.agentSessionId) {
    onEvent({
      kind: "error",
      message: "Sem sessão para retomar — construa primeiro.",
    });
    return { ok: false };
  }
  // Sending is what turns pending uploads into part of the conversation.
  await linkPendingAttachments(build.id, userMessageId);

  // Per-invitation spend ceiling — cost is persisted per turn (AiMessage.costUsd)
  // but otherwise unbounded. Refuse before spending more.
  const capUsd = Number(process.env.AI_BUILD_INVITATION_CAP_USD ?? "25");
  const spentUsd = await sumCostForInvitation(invitationId);
  if (spendCapExceeded(spentUsd, capUsd)) {
    const message = `Limite de custo atingido para este convite ($${spentUsd.toFixed(
      2,
    )} de $${capUsd.toFixed(2)}).`;
    await appendMessage({ buildId: build.id, role: "assistant", content: message });
    onEvent({
      kind: "error",
      message,
      hint: "Aumente AI_BUILD_INVITATION_CAP_USD ou apague versões antigas.",
    });
    return { ok: false };
  }
  const brief = buildInvitationBrief(invitation);
  const attachments = await listAttachmentsForInvitation(invitationId);

  // Every build goes straight to building — the directions gate (which used to
  // propose 4 visual directions and stop) has been removed.
  const existing = await revisionCount(invitationId);
  const isFirstBuild = existing === 0;

  const priorSource = await latestRevisionSource(build.id);
  const attachmentBrief = buildAttachmentBrief(attachments);
  const manifest = buildSourceManifest(priorSource ?? {});

  const rotateLimit = Number(process.env.AI_SESSION_ROTATE_TOKENS ?? "200000");
  const hardCeiling = Number(process.env.AI_SESSION_HARD_CEILING ?? "600000");
  const hasSections = Object.keys(priorSource ?? {}).some((k) =>
    k.startsWith("sections/"),
  );
  const rotate =
    !isCritiqueTurn &&
    !isFirstBuild &&
    shouldRotateSession({
      contextTokens: build.lastContextTokens ?? null,
      limit: rotateLimit,
      hardLimit: hardCeiling,
      hasSections,
    });
  const recap = rotate
    ? buildRecap(
        (await listMessagesForInvitation(invitationId)).slice(0, -1),
        6,
      )
    : "";
  if (rotate) {
    onEvent({
      kind: "progress",
      text: "Sessão reiniciada a partir do código (contexto grande).",
    });
  }

  const fullPrompt = [
    brief,
    direction ? `\n${directionToPrompt(direction)}` : "",
    manifest ? `\n${manifest}` : "",
    recap ? `\n${recap}` : "",
    attachmentBrief ? `\n${attachmentBrief}` : "",
    `\n${isCritiqueTurn ? critiqueToPrompt(critique!) : prompt}`,
  ].join("\n");

  // Opus writes the design (taste is decided on the first build); Sonnet does
  // the edits. A critique turn resumes the first build's session, so it must
  // use the first build's model — a resume under another model drops the cache.
  const model =
    isCritiqueTurn || isFirstBuild
      ? (process.env.AI_BUILD_MODEL_FIRST ?? "claude-opus-5")
      : (process.env.AI_BUILD_MODEL_TWEAK ?? "claude-sonnet-5");
  const effort = isCritiqueTurn ? "medium" : effortFor(isFirstBuild);

  const repoRoot = process.cwd();
  const dts = await readFile(
    path.join(repoRoot, "worker", "templates", "platform.d.ts"),
    "utf8",
  );
  const workspace = path.join(
    repoRoot,
    ".ai-workspaces",
    `inv-${invitationId}`,
  );
  await mkdir(workspace, { recursive: true });
  await provisionWorkspace(workspace, dts, priorSource, attachments);

  // Keep the agent's last prose turn + final cost so the thread survives reload.
  let lastAssistantText = "";
  let costUsd: number | null = null;
  let usage: BuildUsage | null = null;
  // The LAST request's context size. `modelUsage` on the result is cumulative
  // across every request in the query (10 tool iterations ≈ 10× the context),
  // so it cannot drive the rotation decision; each assistant message's own
  // `usage` can.
  let lastRequestContext: number | null = null;

  // Captured from the raw message stream, not only from the return value: the
  // SDK throws on a turn/budget cap, and losing the session id would silently
  // break `resume` on the next turn.
  let sessionIdSeen: string | null = null;
  let agentError: string | null = null;

  try {
    const { sessionId } = await runBuildAgent({
      workspaceDir: workspace,
      prompt: fullPrompt,
      bundleId: slug,
      dts,
      model,
      effort,
      resume: rotate ? undefined : (build.agentSessionId ?? undefined),
      onMessage: (m) => {
        const raw = m as {
          session_id?: string;
          type?: string;
          parent_tool_use_id?: string | null;
          message?: {
            usage?: {
              input_tokens?: number;
              cache_read_input_tokens?: number;
              cache_creation_input_tokens?: number;
            };
          };
        };
        if (typeof raw.session_id === "string") sessionIdSeen = raw.session_id;
        if (
          raw.type === "assistant" &&
          !raw.parent_tool_use_id &&
          raw.message?.usage
        ) {
          const u = raw.message.usage;
          lastRequestContext =
            (u.input_tokens ?? 0) +
            (u.cache_read_input_tokens ?? 0) +
            (u.cache_creation_input_tokens ?? 0);
        }
        const e = toBuildEvent(m);
        if (!e) return;
        if (e.kind === "progress") lastAssistantText = e.text;
        if (e.kind === "result") {
          costUsd = e.costUsd;
          usage = e.usage;
        }
        onEvent(e);
      },
    });
    if (sessionId) sessionIdSeen = sessionId;
  } catch (err) {
    // Do NOT return here. The agent may already have written a valid bundle
    // before it ran out of turns; throwing that away wastes the whole spend.
    agentError = err instanceof Error ? err.message : String(err);
  }
  if (sessionIdSeen) await saveSessionId(build.id, sessionIdSeen);
  // Assigned inside the onMessage callback, which control-flow analysis cannot
  // see — without the cast TS narrows it to `never` here.
  const ctx = lastRequestContext as number | null;
  if (ctx !== null) {
    await prisma.aiBuild.update({
      where: { id: build.id },
      data: { lastContextTokens: ctx },
    });
  }

  // The agent asks rather than guessing what an attachment is for. Checked
  // before bundle verification: on a tweak the previous dist/bundle.js is still
  // on disk, so "no new bundle" cannot signal a question by itself.
  const sentinelPath = path.join(workspace, "NEEDS_INPUT.md");
  const question = await readFile(sentinelPath, "utf8").catch(() => "");
  if (question.trim()) {
    await rm(sentinelPath, { force: true });
    await appendMessage({
      buildId: build.id,
      role: "assistant",
      content: question.trim(),
      costUsd,
      usage,
    });
    onEvent({ kind: "question", text: question.trim() });
    return { ok: true };
  }

  const sourceFiles = await collectSourceFiles(workspace);
  const bundleCode = await readFile(
    path.join(workspace, "dist", "bundle.js"),
    "utf8",
  ).catch(() => "");
  // A capped run leaves the PREVIOUS turn's bundle on disk. Publishing that as
  // a new revision would silently claim success while changing nothing, so a
  // salvage only counts when the source actually moved.
  const sourceUnchanged = sourceFilesEqual(priorSource, sourceFiles);
  const salvageImpossible =
    !bundleCode ||
    !bundleRegistersComponent(bundleCode, slug) ||
    !sourceFiles["index.tsx"] || // the mount contract requires the entry file
    (agentError !== null && sourceUnchanged);

  if (salvageImpossible) {
    const info = agentError
      ? classifyBuildError(agentError)
      : {
          title: "Build did not produce a valid bundle.",
          hint: undefined,
          detail: undefined,
        };
    // Record the failure too — otherwise the thread shows a user turn with no
    // reply on reload, which reads as "still running".
    await appendMessage({
      buildId: build.id,
      role: "assistant",
      content: lastAssistantText
        ? `${info.title}\n\n${lastAssistantText}`
        : info.title,
      costUsd,
      usage,
    });
    onEvent({
      kind: "error",
      message: info.title,
      hint: info.hint,
      detail: info.detail,
    });
    return { ok: false };
  }

  if (agentError) {
    // Work survived the cap — say so rather than pretending it went cleanly.
    onEvent({
      kind: "progress",
      text: "O agente parou antes de terminar, mas o que já tinha construído foi guardado como rascunho.",
    });
  }

  let revisionId: string;
  if (isCritiqueTurn) {
    // The review fixes the draft the admin is already looking at — no new
    // revision, or the rail would show two entries for one design.
    const latest = await latestDraftRevisionId(invitationId);
    if (!latest) {
      onEvent({ kind: "error", message: "Não há rascunho para atualizar." });
      return { ok: false };
    }
    await updateDraftRevisionSource(latest, sourceFiles, bundleCode);
    revisionId = latest;
  } else {
    ({ revisionId } = await createDraftRevision({
      buildId: build.id,
      invitationId,
      prompt,
      sourceFiles,
      bundleCode,
    }));
  }
  await appendMessage({
    buildId: build.id,
    role: "assistant",
    content: lastAssistantText || "Draft ready.",
    revisionId,
    costUsd,
    usage,
  });
  onEvent({
    kind: "draft",
    revisionId,
    slug,
    firstBuild: isFirstBuild && !isCritiqueTurn,
  });
  return { ok: true };
}
