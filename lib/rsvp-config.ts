import { normalizeRsvpCustomFields } from "@/lib/rsvp-custom-fields";
import type { RsvpCustomField } from "@/lib/types";

export interface RsvpConfigWithEmail {
  enabled?: boolean;
  deadline?: string;
  showEmail?: boolean;
  showDietaryRestrictions?: boolean;
  showCompanion?: boolean;
  customFields?: RsvpCustomField[];
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

/**
 * Total attending headcount: each attending response is one guest, plus one
 * more when it carries a non-empty companion name. Declined responses count 0.
 */
export function countAttendingGuests(
  responses: { attending: boolean; companion?: string | null }[],
): number {
  return responses.reduce((sum, r) => {
    if (!r.attending) return sum;
    return sum + 1 + (r.companion && r.companion.trim() ? 1 : 0);
  }, 0);
}

export function getRsvpCustomFields(
  config: RsvpConfigWithEmail | null | undefined,
): RsvpCustomField[] {
  return normalizeRsvpCustomFields(config);
}
