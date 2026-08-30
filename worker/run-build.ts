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
  publishRevision,
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

  const { sessionId } = await runBuildAgent({
    workspaceDir: workspace,
    prompt: fullPrompt,
    bundleId: slug,
    resume: build.agentSessionId ?? undefined,
    onMessage: (m) => {
      const e = toBuildEvent(m);
      if (e) onEvent(e);
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
    onEvent({ kind: "error", message: "Build did not produce a valid bundle." });
    return { ok: false };
  }

  const { revisionId, bundleUrl } = await publishRevision({
    buildId: build.id,
    invitationId,
    prompt,
    sourceFiles: { "index.tsx": indexTsx },
    bundleCode,
  });
  onEvent({ kind: "published", revisionId, bundleUrl, slug });
  return { ok: true };
}
