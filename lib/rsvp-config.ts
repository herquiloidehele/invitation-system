export interface RsvpConfigWithEmail {
  enabled?: boolean;
  deadline?: string;
  showEmail?: boolean;
  showDietaryRestrictions?: boolean;
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
