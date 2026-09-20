import { cache } from "react";
import { NextResponse } from "next/server";

import { prisma } from "./db";

// ---------------------------------------------------------------------------
// Invitation blocking
//
// An admin can block an invitation (`Invitation.blockedAt` set). Every public
// and owner-facing surface must then show the blocked notice (pages) or answer
// 403 (APIs). Block state is deliberately NOT part of InvitationData: it is
// read straight off Prisma rows via the helpers below.
// ---------------------------------------------------------------------------

/** Spread into any `select` that needs to honour a block. */
export const invitationBlockSelect = {
  blockedAt: true,
  blockedReason: true,
} as const;

export type InvitationBlockFields = {
  blockedAt: Date | null;
  blockedReason?: string | null;
};

export type InvitationBlockState = { reason: string | null };

/** pt-PT message returned by API guards (admin/API copy is not localized). */
export const INVITATION_BLOCKED_MESSAGE = "Este convite foi bloqueado.";

/** True when `blockedAt` is set. Missing rows are not blocked. */
export function isInvitationBlocked(
  row: Pick<InvitationBlockFields, "blockedAt"> | null | undefined,
): boolean {
  return row?.blockedAt != null;
}

/** `{ reason }` when blocked (trimmed; blank → null), otherwise null. */
export function getInvitationBlockState(
  row: InvitationBlockFields | null | undefined,
): InvitationBlockState | null {
  if (!row || !isInvitationBlocked(row)) return null;
  const reason = row.blockedReason?.trim() ?? "";
  return { reason: reason.length > 0 ? reason : null };
}

/**
 * Request-scoped lookup of just the two block columns. Pages whose
 * `getInvitation()` call returned null use it to tell "blocked" from
 * "missing" (the loader fails closed for blocked rows).
 */
export const getInvitationBlock = cache(
  async (slug: string): Promise<InvitationBlockState | null> => {
    const row = await prisma.invitation.findUnique({
      where: { slug },
      select: invitationBlockSelect,
    });
    return getInvitationBlockState(row);
  },
);

/**
 * 403 shared by every public/owner API guard. Carries `error` (owner/guest
 * route convention) and `success`/`message` (RSVP route convention) so every
 * existing client surfaces something sensible.
 */
export function invitationBlockedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "invitation_blocked",
      success: false,
      message: INVITATION_BLOCKED_MESSAGE,
    },
    { status: 403 },
  );
}
