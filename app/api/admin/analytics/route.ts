import { NextRequest, NextResponse } from "next/server";
import { getInvitationAnalytics } from "@/lib/admin-analytics";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30d";
  const slug = searchParams.get("slug"); // optional: single invitation

  const data = await getInvitationAnalytics({ range, slug });
  return NextResponse.json(data);
}
