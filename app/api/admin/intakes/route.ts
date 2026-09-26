import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { parseContact, parseIntakeKind } from "@/lib/intake/catalog";
import { invalidBody, jsonError, originFromHeaders } from "@/lib/intake/http";
import { buildIntakeUrl } from "@/lib/intake/links";
import { findDemo } from "@/lib/intake/service";
import { generateIntakeToken } from "@/lib/intake/tokens";

// ---------------------------------------------------------------------------
// POST /api/admin/intakes — the studio creates a personal intake link for a
// customer (auth: proxy.ts gates /api/admin/*). Name and WhatsApp are
// optional here: the customer confirms them on the first step.
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  productKind: z.string(),
  demoId: z.string().min(1).max(64),
  contactName: z.string().max(200).optional(),
  contactWhatsapp: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(body);
  const kind = parsed.success ? parseIntakeKind(parsed.data.productKind) : null;
  if (!parsed.success || !kind) {
    return invalidBody([{ field: "body", message: "invalid" }]);
  }

  const contact = parseContact(
    { name: parsed.data.contactName, whatsapp: parsed.data.contactWhatsapp },
    "lenient",
  );
  if (!contact.ok) return invalidBody(contact.issues);

  try {
    const demo = await findDemo(kind, { id: parsed.data.demoId });
    if (!demo || !demo.isDemo) return jsonError("Demo not found", 404);

    const token = generateIntakeToken();
    const intake = await prisma.intake.create({
      data: {
        token,
        productKind: kind,
        invitationId: kind === "convite" ? demo.id : null,
        saveTheDateId: kind === "save-the-date" ? demo.id : null,
        demoSlug: demo.slug,
        demoName: demo.name,
        source: "admin",
        locale: "pt",
        status: "draft",
        contactName: contact.contact.name || null,
        contactWhatsapp: contact.contact.whatsapp || null,
      },
      select: { id: true, token: true },
    });

    return NextResponse.json(
      {
        id: intake.id,
        token: intake.token,
        url: buildIntakeUrl(originFromHeaders(request.headers), token, "pt"),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Admin API] Error creating intake:", error);
    return jsonError("Failed to create intake", 500);
  }
}
