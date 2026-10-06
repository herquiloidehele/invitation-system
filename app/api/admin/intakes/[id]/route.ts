import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { parseContact, parseIntakeStatus } from "@/lib/intake/catalog";
import { invalidBody, jsonError } from "@/lib/intake/http";

// PATCH / DELETE /api/admin/intakes/[id] — status changes, contact fixes and
// removal. Auth: proxy.ts gates /api/admin/*.

const patchSchema = z.object({
  status: z.string().optional(),
  contactName: z.string().max(200).optional(),
});

async function exists(id: string): Promise<boolean> {
  const row = await prisma.intake.findUnique({
    where: { id },
    select: { id: true },
  });
  return Boolean(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return invalidBody([{ field: "body", message: "invalid" }]);
  }

  const data: Prisma.IntakeUpdateInput = {};
  if (parsed.data.status !== undefined) {
    const status = parseIntakeStatus(parsed.data.status);
    if (!status) return invalidBody([{ field: "status", message: "invalid" }]);
    data.status = status;
  }
  if (parsed.data.contactName !== undefined) {
    const contact = parseContact({ name: parsed.data.contactName }, "lenient");
    if (!contact.ok) return invalidBody(contact.issues);
    data.contactName = contact.contact.name || null;
  }

  try {
    if (!(await exists(id))) return jsonError("Intake not found", 404);
    const updated = await prisma.intake.update({
      where: { id },
      data,
      select: {
        id: true,
        status: true,
        contactName: true,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin API] Error updating intake:", error);
    return jsonError("Failed to update intake", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    if (!(await exists(id))) return jsonError("Intake not found", 404);
    await prisma.intake.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin API] Error deleting intake:", error);
    return jsonError("Failed to delete intake", 500);
  }
}
