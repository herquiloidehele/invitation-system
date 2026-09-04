import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getInvitation } from "@/lib/invitations";
import { publicUrlForKey, putObjectBuffer } from "@/lib/s3";
import { buildInvitationBrief } from "@/worker/lib/invitation-brief";
import { critiqueDesign } from "@/worker/lib/critique";
import type { Direction } from "@/worker/lib/directions";
import { appendMessage, getOrCreateBuild } from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_SHOTS = 6;
const MAX_BYTES_PER_SHOT = 2 * 1024 * 1024;

function decodeJpeg(dataUrl: string): Buffer | null {
  const m = /^data:image\/jpeg;base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[1], "base64");
  return buf.byteLength <= MAX_BYTES_PER_SHOT ? buf : null;
}

/**
 * The visual critique. The admin's browser captured the rendered preview
 * (see AiPreviewCaptureBridge); this stores the evidence, has a fresh pair of
 * eyes judge it, and records the verdict on the thread.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    slug?: string;
    revisionId?: string;
    direction?: Direction | null;
    /** Phone tiles, top-to-bottom. */
    shots?: Array<{
      /** CSS px the frame was rendered at. */
      width?: number;
      dataUrl: string;
    }>;
  } | null;

  const slug = body?.slug?.trim();
  const revisionId = body?.revisionId?.trim();
  const shots = (body?.shots ?? []).slice(0, MAX_SHOTS);
  if (!slug || !revisionId || shots.length === 0) {
    return NextResponse.json(
      { error: "slug, revisionId and shots are required" },
      { status: 400 },
    );
  }

  const invitation = await getInvitation(slug);
  const row = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!invitation || !row) {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
    );
  }

  // Keep the evidence: the card links to exactly what the reviewer saw.
  const images: Array<{ jpeg: Buffer; width: number | null }> = [];
  const screenshots: string[] = [];
  // Per-run stamp: a manual re-review must not overwrite the earlier round's
  // evidence, which the older card still links to.
  const run = Date.now().toString(36);
  for (const [i, shot] of shots.entries()) {
    const jpeg = decodeJpeg(shot.dataUrl);
    if (!jpeg) continue;
    const key = `ai-critique/${row.id}/${revisionId}-${run}-${i}.jpg`;
    await putObjectBuffer(key, jpeg, "image/jpeg");
    screenshots.push(publicUrlForKey(key));
    const width =
      typeof shot.width === "number" && shot.width > 0
        ? Math.round(shot.width)
        : null;
    images.push({ jpeg, width });
  }
  if (images.length === 0) {
    return NextResponse.json({ error: "no valid JPEG shots" }, { status: 400 });
  }

  let critique;
  try {
    critique = await critiqueDesign({
      images,
      direction: body?.direction ?? null,
      brief: buildInvitationBrief(invitation),
    });
  } catch (err) {
    // The model call is the step that fails in practice (overload, a rejected
    // image, a schema miss). Say why, so the card can show it.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai-critique] critiqueDesign failed:", message);
    return NextResponse.json(
      { error: `A análise falhou: ${message}` },
      { status: 502 },
    );
  }

  const build = await getOrCreateBuild(row.id);
  const payload = { ...critique, screenshots };
  await appendMessage({
    buildId: build.id,
    role: "assistant",
    content: `Revisão visual: ${critique.score}/10 — ${
      critique.verdict === "ship" ? "aprovado" : "a corrigir"
    }.`,
    critique: payload,
  });

  return NextResponse.json({ critique, screenshots });
}
