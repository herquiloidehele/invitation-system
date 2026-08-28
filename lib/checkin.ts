/**
 * Pure check-in domain logic. No Prisma, no React — fully unit-testable.
 */
import { randomBytes } from "node:crypto";

export type CheckInSubjectType = "guest" | "rsvp";
export type RsvpStatus = "confirmed" | "declined" | "none";

/** Unified view of a scannable pass, independent of its underlying table. */
export interface CheckInPass {
  subjectType: CheckInSubjectType;
  subjectId: string;
  /** The token encoded in the QR (guest.token or rsvp.checkInToken). */
  token: string;
  name: string;
  partySize: number;
  rsvpStatus: RsvpStatus;
  tableLabel?: string;
  /** ISO string, or null when not yet checked in. */
  checkedInAt: string | null;
  arrivedCount: number | null;
}

export type ParsedScan =
  | { type: "guest"; token: string }
  | { type: "pass"; token: string }
  | { type: "raw"; token: string };

/** Derive RSVP status from a guest's responses; the latest submission wins. */
export function rsvpStatusFromResponses(
  responses: ReadonlyArray<{ attending: boolean; submittedAt: string | Date }>,
): RsvpStatus {
  if (responses.length === 0) return "none";
  const latest = [...responses].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  )[0];
  return latest.attending ? "confirmed" : "declined";
}

export function guestPartySize(totalGuests: number | null | undefined): number {
  return totalGuests && totalGuests > 0 ? totalGuests : 1;
}

export function rsvpPartySize(
  numAdults: number | null | undefined,
  numChildren: number | null | undefined,
): number {
  const sum = (numAdults ?? 0) + (numChildren ?? 0);
  return sum > 0 ? sum : 1;
}

/** Clamp a requested arrived count: default to partySize, floor at 0, round. */
export function clampArrivedCount(
  requested: number | undefined,
  partySize: number,
): number {
  if (requested === undefined || Number.isNaN(requested)) return partySize;
  return Math.max(0, Math.round(requested));
}

/**
 * Compute the persisted check-in state. `checkedInAt` is set once (first
 * check-in) and never overwritten; `arrivedCount` is always updated.
 */
export function computeCheckInUpdate(
  existing: { checkedInAt: Date | null },
  arrivedCount: number,
  now: Date,
): { checkedInAt: Date; arrivedCount: number } {
  return {
    checkedInAt: existing.checkedInAt ?? now,
    arrivedCount,
  };
}

/**
 * Parse a scanned string into a token reference. Understands personal invite
 * URLs (`?g=`), pass URLs (`?c=`), and bare tokens.
 */
export function parseScannedValue(scanned: string): ParsedScan | null {
  const trimmed = scanned.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const g = url.searchParams.get("g");
    if (g) return { type: "guest", token: g };
    const c = url.searchParams.get("c");
    if (c) return { type: "pass", token: c };
  } catch {
    // Not a URL — fall through to raw.
  }
  return { type: "raw", token: trimmed };
}

/** Generate an unguessable bearer token (matches the gift-reservation pattern). */
export function generateCheckInToken(): string {
  return randomBytes(32).toString("base64url");
}
