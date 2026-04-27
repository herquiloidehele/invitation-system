import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GuestValidationError, selfRegisterGuest } from "@/lib/guests";
import { buildPersonalInviteUrl } from "@/lib/guest-links";

const schema = z.object({
  inviterToken: z.string().min(1),
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const guest = await selfRegisterGuest(parsed.data);

    // Build the personal URL so the inviter can copy/share it
    const origin = request.nextUrl.origin;
    const personalUrl = buildPersonalInviteUrl({
      origin,
      slug: guest.invitationSlug,
      token: guest.token,
      name: guest.name,
    });

    return NextResponse.json(
      {
        guest: {
          token: guest.token,
          name: guest.name,
          companion: guest.companion,
          invitationSlug: guest.invitationSlug,
        },
        personalUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GuestValidationError) {
      const status = error.field === "inviterToken" ? 403 : 400;
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status },
      );
    }
    console.error("[Self-Register] Error:", error);
    return NextResponse.json(
      { error: "Failed to register guest" },
      { status: 500 },
    );
  }
}
