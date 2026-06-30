import { normalizeRsvpCustomFields } from "@/lib/rsvp-custom-fields";
import type { RsvpCustomField } from "@/lib/types";

export interface RsvpConfigWithEmail {
  enabled?: boolean;
  deadline?: string;
  showEmail?: boolean;
  showDietaryRestrictions?: boolean;
  showCompanion?: boolean;
  showNumAdults?: boolean;
  showNumChildren?: boolean;
  customFields?: RsvpCustomField[];
  acceptingResponses?: boolean;
}

/**
 * True when the host has closed RSVP confirmations for this invitation.
 * `acceptingResponses` is default-open: only an explicit `false` closes it,
 * so missing/`true` values (every existing invitation) stay open.
 */
export function isRsvpClosed(
  config: RsvpConfigWithEmail | null | undefined,
): boolean {
  return config?.acceptingResponses === false;
}

export function shouldShowRsvpEmail(
  config: RsvpConfigWithEmail | null | undefined,
): boolean {
  return config?.showEmail === true;
}

export function shouldShowRsvpDietaryRestrictions(
  config: RsvpConfigWithEmail | null | undefined,
): boolean {
  return config?.showDietaryRestrictions !== false;
}

export function shouldShowRsvpCompanion(
  config: RsvpConfigWithEmail | null | undefined,
): boolean {
  return config?.showCompanion === true;
}

export function shouldShowRsvpNumAdults(
  config: RsvpConfigWithEmail | null | undefined,
): boolean {
  return config?.showNumAdults === true;
}

export function shouldShowRsvpNumChildren(
  config: RsvpConfigWithEmail | null | undefined,
): boolean {
  return config?.showNumChildren === true;
}

/**
 * Total attending headcount. When the adults/children fields are active for
 * this invitation, each attending response contributes
 * `numAdults + numChildren` (the responder is counted as one of the adults,
 * and the companion is not double-counted). Otherwise each attending response
 * is one guest, plus one when it carries a non-empty companion name. Declined
 * responses count 0.
 */
export function countAttendingGuests(
  responses: {
    attending: boolean;
    companion?: string | null;
    numAdults?: number | null;
    numChildren?: number | null;
  }[],
  config?: RsvpConfigWithEmail | null,
): number {
  const showAdults = shouldShowRsvpNumAdults(config);
  const showChildren = shouldShowRsvpNumChildren(config);
  return responses.reduce((sum, r) => {
    if (!r.attending) return sum;
    const base = showAdults ? (r.numAdults ?? 1) : 1;
    const kids = showChildren ? (r.numChildren ?? 0) : 0;
    const companionExtra =
      !showAdults && r.companion && r.companion.trim() ? 1 : 0;
    return sum + base + kids + companionExtra;
  }, 0);
}

export function getRsvpCustomFields(
  config: RsvpConfigWithEmail | null | undefined,
): RsvpCustomField[] {
  return normalizeRsvpCustomFields(config);
}
