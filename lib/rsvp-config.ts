import { normalizeRsvpCustomFields } from "@/lib/rsvp-custom-fields";
import type { RsvpCustomField } from "@/lib/types";

export interface RsvpConfigWithEmail {
  enabled?: boolean;
  deadline?: string;
  showEmail?: boolean;
  showDietaryRestrictions?: boolean;
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

export function getRsvpCustomFields(
  config: RsvpConfigWithEmail | null | undefined,
): RsvpCustomField[] {
  return normalizeRsvpCustomFields(config);
}
