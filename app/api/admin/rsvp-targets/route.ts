import { NextRequest, NextResponse } from "next/server";

import { parseSearch } from "@/lib/admin-list/params";
import { searchRsvpTargets } from "@/lib/admin-list/rsvps";

// ---------------------------------------------------------------------------
// GET /api/admin/rsvp-targets?kind=invitation|std&q= — Options for the
// Confirmações picker: newest first, at most 20.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");

  if (kind !== "invitation" && kind !== "std") {
    return NextResponse.json(
      { error: "Invalid kind: expected invitation or std" },
      { status: 400 },
    );
  }

  try {
    const items = await searchRsvpTargets(
      kind,
      parseSearch(searchParams.get("q") ?? undefined),
    );
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[Admin API] Error listing RSVP targets:", error);
    return NextResponse.json(
      { error: "Failed to list RSVP targets" },
      { status: 500 },
    );
  }
}
