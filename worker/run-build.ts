import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { getInvitation } from "@/lib/invitations";
import { provisionWorkspace } from "./provision";
import { runBuildAgent } from "./agent";
import { bundleRegistersComponent } from "./lib/verify-bundle";
import { buildInvitationBrief } from "./lib/invitation-brief";
import { toBuildEvent, type BuildEvent } from "./lib/build-events";
import {
  getOrCreateBuild,
  latestRevisionSource,
  createDraftRevision,
  appendMessage,
  saveSessionId,
} from "./persistence";

/**
 * The full build-and-publish flow, emitting typed events. Reused by the human
 * CLI and the NDJSON entry (which the admin SSE route spawns).
 */
export async function runInvitationBuild(args: {
  slug: string;
  prompt: string;
  onEvent: (event: BuildEvent) => void;
}): Promise<{ ok: boolean }> {
  const { slug, prompt, onEvent } = args;

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
  await appendMessage({ buildId: build.id, role: "user", content: prompt });
  const priorSource = await latestRevisionSource(build.id);
  const fullPrompt = `${buildInvitationBrief(invitation)}\n\n${prompt}`;

  const repoRoot = process.cwd();
  const dts = await readFile(
    path.join(repoRoot, "worker", "templates", "platform.d.ts"),
    "utf8",
  );
  const workspace = path.join(repoRoot, ".ai-workspaces", `inv-${invitationId}`);
  await mkdir(workspace, { recursive: true });
  await provisionWorkspace(workspace, dts, priorSource);

  // Keep the agent's last prose turn + final cost so the thread survives reload.
  let lastAssistantText = "";
  let costUsd: number | null = null;

  const { sessionId } = await runBuildAgent({
    workspaceDir: workspace,
    prompt: fullPrompt,
    bundleId: slug,
    dts,
    resume: build.agentSessionId ?? undefined,
    onMessage: (m) => {
      const e = toBuildEvent(m);
      if (!e) return;
      if (e.kind === "progress") lastAssistantText = e.text;
      if (e.kind === "result") costUsd = e.costUsd;
      onEvent(e);
    },
  });
  if (sessionId) await saveSessionId(build.id, sessionId);

  const indexTsx = await readFile(
    path.join(workspace, "index.tsx"),
    "utf8",
  ).catch(() => "");
  const bundleCode = await readFile(
    path.join(workspace, "dist", "bundle.js"),
    "utf8",
  ).catch(() => "");
  if (!bundleCode || !bundleRegistersComponent(bundleCode, slug)) {
    const message = "Build did not produce a valid bundle.";
    // Record the failure too — otherwise the thread shows a user turn with no
    // reply on reload, which reads as "still running".
    await appendMessage({
      buildId: build.id,
      role: "assistant",
      content: lastAssistantText
        ? `${message}\n\n${lastAssistantText}`
        : message,
      costUsd,
    });
    onEvent({ kind: "error", message });
    return { ok: false };
  }

  const { revisionId } = await createDraftRevision({
    buildId: build.id,
    invitationId,
    prompt,
    sourceFiles: { "index.tsx": indexTsx },
  });
  await appendMessage({
    buildId: build.id,
    role: "assistant",
    content: lastAssistantText || "Draft ready.",
    revisionId,
    costUsd,
  });
  onEvent({ kind: "draft", revisionId, slug });
  return { ok: true };
}
