import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { getInvitation } from "@/lib/invitations";
import { provisionWorkspace } from "./provision";
import { runBuildAgent } from "./agent";
import { bundleRegistersComponent } from "./lib/verify-bundle";
import { buildInvitationBrief } from "./lib/invitation-brief";
import {
  getOrCreateBuild,
  latestRevisionSource,
  publishRevision,
  saveSessionId,
} from "./persistence";

async function main() {
  const [slug, ...rest] = process.argv.slice(2);
  const designPrompt = rest.join(" ").trim();
  if (!slug || !designPrompt) {
    console.error(
      'Usage: npx tsx worker/build-for-invitation.ts <slug> "<design prompt>"',
    );
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    process.exit(1);
  }

  const invitation = await getInvitation(slug);
  if (!invitation) {
    console.error(`No invitation with slug "${slug}".`);
    process.exit(1);
    return;
  }
  const invRow = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  const invitationId = invRow!.id;

  const build = await getOrCreateBuild(invitationId);
  const priorSource = await latestRevisionSource(build.id);
  const brief = buildInvitationBrief(invitation);
  const fullPrompt = `${brief}\n\n${designPrompt}`;

  const repoRoot = process.cwd();
  const dts = await readFile(
    path.join(repoRoot, "worker", "templates", "platform.d.ts"),
    "utf8",
  );
  const workspace = path.join(repoRoot, ".ai-workspaces", `inv-${invitationId}`);
  await mkdir(workspace, { recursive: true });
  await provisionWorkspace(workspace, dts, priorSource);
  console.log(`workspace: ${workspace} (${priorSource ? "resuming" : "fresh"})`);

  const { costUsd, sessionId } = await runBuildAgent({
    workspaceDir: workspace,
    prompt: fullPrompt,
    bundleId: slug, // the runtime mounts by slug
    resume: build.agentSessionId ?? undefined,
    onMessage: (m) => {
      const r = m as { type?: string; subtype?: string };
      if (r.type === "assistant" || r.type === "result") {
        console.log(`${r.type}${r.subtype ? `/${r.subtype}` : ""}`);
      }
    },
  });
  if (sessionId) await saveSessionId(build.id, sessionId);
  console.log(`cost: ${costUsd == null ? "?" : `$${costUsd.toFixed(2)}`}`);

  const indexTsx = await readFile(
    path.join(workspace, "index.tsx"),
    "utf8",
  ).catch(() => "");
  const bundleCode = await readFile(
    path.join(workspace, "dist", "bundle.js"),
    "utf8",
  ).catch(() => "");
  if (!bundleCode) {
    console.error("FAIL: agent produced no bundle.");
    process.exit(2);
    return;
  }
  if (!bundleRegistersComponent(bundleCode, slug)) {
    console.error("FAIL: bundle does not register under the slug.");
    process.exit(3);
    return;
  }

  const { revisionId, bundleUrl } = await publishRevision({
    buildId: build.id,
    invitationId,
    prompt: designPrompt,
    sourceFiles: { "index.tsx": indexTsx },
    bundleCode,
  });

  console.log(`PUBLISHED revision ${revisionId}`);
  console.log(`bundle: ${bundleUrl}`);
  console.log(`live at: /pt/${slug}`);
  process.exit(0);
}

void main();
