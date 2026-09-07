import { NextRequest, NextResponse } from "next/server";

import {
  CustomFontServiceError,
  getOrCreateCustomFontFamilyFromPending,
} from "@/lib/custom-fonts/admin-service";
import type { CustomFontStyle, FontCategory } from "@/lib/custom-fonts/types";
import { prisma } from "@/lib/db";
import {
  deleteFontAsset,
  getOrCreateBuild,
  listFontAssetsForInvitation,
  listPendingFontAssets,
  recordFontAsset,
} from "@/worker/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORIES = new Set<FontCategory>([
  "serif",
  "sans-serif",
  "display",
  "handwriting",
  "monospace",
]);

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
  const pendingOnly = req.nextUrl.searchParams.get("pending") === "1";
  return NextResponse.json({
    fonts: pendingOnly
      ? await listPendingFontAssets(invitationId)
      : await listFontAssetsForInvitation(invitationId),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    slug?: string;
    pendingKey?: string;
    originalFileName?: string;
    familyName?: string;
    checksum?: string;
    weight?: number;
    style?: CustomFontStyle;
    category?: FontCategory;
  } | null;

  const slug = body?.slug?.trim();
  const pendingKey = body?.pendingKey?.trim();
  const familyName = body?.familyName?.trim();
  const checksum = body?.checksum?.trim();
  if (!slug || !pendingKey || !familyName || !checksum || !body?.weight || !body?.style) {
    return NextResponse.json(
      { error: "slug, pendingKey, familyName, checksum, weight and style are required" },
      { status: 400 },
    );
  }

  const invitationId = await invitationIdForSlug(slug);
  if (!invitationId) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const category: FontCategory =
    body.category && CATEGORIES.has(body.category) ? body.category : "display";

  try {
    // Get-or-create the global font family, then link it to this build. The
    // heavy lifting (validation, @font-face, storage) is the shared custom-font
    // pipeline; we only add the per-invitation association the agent reads.
    const family = await getOrCreateCustomFontFamilyFromPending({
      name: familyName,
      fallbackCategory: category,
      pendingKey,
      originalFileName: body.originalFileName ?? familyName,
      expectedChecksum: checksum,
      weight: body.weight,
      style: body.style,
      replace: false,
    });

    const build = await getOrCreateBuild(invitationId);
    const font = await recordFontAsset({
      buildId: build.id,
      invitationId,
      customFontFamilyId: family.id,
      family: family.family,
      cssFamily: family.cssFamily,
      category: family.category,
    });
    return NextResponse.json({ font });
  } catch (error) {
    if (error instanceof CustomFontServiceError) {
      const status = error.code === "file_too_large" ? 413 : 400;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status },
      );
    }
    console.error("[ai/fonts]", error);
    return NextResponse.json(
      { error: "Não foi possível registar a fonte." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  try {
    await deleteFontAsset(id);
  } catch {
    return NextResponse.json({ error: "Font not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
