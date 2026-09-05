import { NextRequest, NextResponse } from "next/server";

import { cancelBuild } from "@/lib/ai-build-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Kill the build currently running for a slug, if any. Auth via the proxy. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { slug?: string } | null;
  const slug = body?.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  return NextResponse.json({ cancelled: cancelBuild(slug) });
}
