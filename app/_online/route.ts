import { NextResponse } from "next/server";

// The Canva runtime embedded inside the proxied iframes polls
// `/_online?<timestamp>` indefinitely (observed every 2-7 s) as a
// connectivity heartbeat. In production these requests would otherwise
// hit our normal Next.js routing and 404 with a full HTML response,
// turning a passive heartbeat into a few KB of network + a server
// invocation every few seconds per open invitation. Replying with a
// fast empty 204 eliminates the cost without changing client behaviour.
//
// We force `dynamic = "force-dynamic"` because the URL always carries a
// unique cache-busting query string and we never want it cached.

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "cache-control": "no-store, max-age=0",
} as const;

export function GET(): NextResponse {
  return new NextResponse(null, { status: 204, headers: NO_CACHE_HEADERS });
}

export function HEAD(): NextResponse {
  return new NextResponse(null, { status: 204, headers: NO_CACHE_HEADERS });
}
