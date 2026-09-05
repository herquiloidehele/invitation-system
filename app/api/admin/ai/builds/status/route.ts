import { NextRequest, NextResponse } from "next/server";

import { getBuildStatus } from "@/lib/ai-build-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Whether a build is running for a slug (drives the reconnect banner). */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  const st = getBuildStatus(slug);
  return NextResponse.json({
    running: st.running,
    startedAt: st.startedAt,
    elapsedMs: st.startedAt ? Date.now() - st.startedAt : 0,
  });
}
