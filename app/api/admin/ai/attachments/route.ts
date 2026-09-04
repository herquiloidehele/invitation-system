import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  deleteAttachment,
  getOrCreateBuild,
  listAttachmentsForInvitation,
  recordAttachment,
} from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Only these reach the agent; PDFs are reference-only, images can be either. */
function kindFor(mimeType: string): "image" | "pdf" | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return null;
}

async function invitationIdForSlug(slug: string): Promise<string | null> {
  const inv = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  return inv?.id ?? null;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  const invitationId = await invitationIdForSlug(slug);
  if (!invitationId) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  return NextResponse.json({
    attachments: await listAttachmentsForInvitation(invitationId),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    slug?: string;
    name?: string;
    mimeType?: string;
    objectKey?: string;
    url?: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
  } | null;

  const slug = body?.slug?.trim();
  const kind = body?.mimeType ? kindFor(body.mimeType) : null;
  if (!slug || !body?.name || !body.objectKey || !body.url || !kind) {
    return NextResponse.json(
      { error: "slug, name, mimeType, objectKey and url are required" },
      { status: 400 },
    );
  }

  const invitationId = await invitationIdForSlug(slug);
  if (!invitationId) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const build = await getOrCreateBuild(invitationId);
  const attachment = await recordAttachment({
    buildId: build.id,
    invitationId,
    name: body.name,
    kind,
    mimeType: body.mimeType!,
    objectKey: body.objectKey,
    url: body.url,
    sizeBytes: body.sizeBytes ?? 0,
    width: body.width ?? null,
    height: body.height ?? null,
  });
  return NextResponse.json({ attachment });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  try {
    await deleteAttachment(id);
  } catch {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
