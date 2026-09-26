import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveLocale } from "@/i18n/locales";
import { prisma } from "@/lib/db";
import { invitationBlockedResponse } from "@/lib/invitation-block";
import { parseContact, parseIntakeKind } from "@/lib/intake/catalog";
import {
  intakeCreateLimiter,
  invalidBody,
  jsonError,
  readJsonBody,
  requestIp,
  tooManyRequests,
} from "@/lib/intake/http";
import { buildIntakePath, intakeRef } from "@/lib/intake/links";
import { findDemo } from "@/lib/intake/service";
import { generateIntakeToken, hashIp } from "@/lib/intake/tokens";

// ---------------------------------------------------------------------------
// POST /api/intakes — a customer starts an intake from the landing details
// page. Public: guarded by a honeypot, an IP rate limit and strict contact
// validation. The intake row is only created once the contact step is valid,
// so casual clicks on "Personalizar" never create junk.
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  productKind: z.string(),
  demoSlug: z.string().trim().min(1).max(120),
  locale: z.string().max(5).optional(),
  contactName: z.string().max(200).optional(),
  contactWhatsapp: z.string().max(40).optional(),
  // Honeypot: hidden from people, filled in by naive bots.
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const ip = requestIp(request);
  if (!intakeCreateLimiter.check(ip ?? "unknown")) return tooManyRequests();

  const read = await readJsonBody(request);
  if (!read.ok) return read.response;

  const parsed = bodySchema.safeParse(read.body);
  const kind = parsed.success ? parseIntakeKind(parsed.data.productKind) : null;
  if (!parsed.success || !kind) {
    return invalidBody([{ field: "body", message: "invalid" }]);
  }
  if (parsed.data.website?.trim()) {
    return invalidBody([{ field: "body", message: "invalid" }]);
  }

  const contact = parseContact(
    { name: parsed.data.contactName, whatsapp: parsed.data.contactWhatsapp },
    "strict",
  );
  if (!contact.ok) return invalidBody(contact.issues);

  try {
    const demo = await findDemo(kind, { slug: parsed.data.demoSlug });
    if (!demo || !demo.isDemo) return jsonError("demo_not_found", 404);
    // `blocked` comes from isInvitationBlocked() in the service.
    if (demo.blocked) return invitationBlockedResponse();

    const locale = resolveLocale(parsed.data.locale);
    const token = generateIntakeToken();
    const intake = await prisma.intake.create({
      data: {
        token,
        productKind: kind,
        invitationId: kind === "convite" ? demo.id : null,
        saveTheDateId: kind === "save-the-date" ? demo.id : null,
        demoSlug: demo.slug,
        demoName: demo.name,
        source: "self",
        locale,
        status: "draft",
        contactName: contact.contact.name,
        contactWhatsapp: contact.contact.whatsapp,
        lastStep: "event",
        ipHash: hashIp(ip, process.env.JWT_SECRET ?? "intake"),
        userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        token,
        path: buildIntakePath(token, locale),
        reference: intakeRef(intake.id),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Intake API] Error creating intake:", error);
    return jsonError("server_error", 500);
  }
}
