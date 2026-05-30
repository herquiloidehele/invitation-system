import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { canvaProxyRevalidateBodySchema } from "@/lib/canva-proxy-hosts";

/* ------------------------------------------------------------------ */
/*  Canva Proxy — Cache Revalidation                                    */
/*                                                                      */
/*  Authenticated endpoint (auth handled by proxy.ts via the           */
/*  /api/admin/* matcher) for busting Next.js data-cache entries        */
/*  produced by `app/canva-proxy/[...path]/route.ts`.                  */
/*                                                                      */
/*  Body (JSON):                                                        */
/*    {}                          -> revalidateTag("canva-proxy")      */
/*    { "host": "<allowed>" }     -> revalidateTag(`canva-proxy:<host>`)*/
/*                                                                      */
/*  The host (if provided) must satisfy `isHostAllowed`. This keeps    */
/*  the schema in lockstep with the proxy's own allowlist.             */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    // Empty body / non-JSON body is acceptable — treat as `{}`.
    raw = {};
  }

  const parsed = canvaProxyRevalidateBodySchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const tag = parsed.data.host
    ? `canva-proxy:${parsed.data.host}`
    : "canva-proxy";

  // Next 16 requires a `profile` argument; `"max"` matches the
  // pre-Next-16 behavior of expiring the cache entry immediately.
  // See https://nextjs.org/docs/messages/revalidate-tag-single-arg
  revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, tag });
}
