import { RSVP_SUBMITTED_SLUGS_KEY } from "./constants";

/** Slugs this browser has already RSVP'd to. Shared with the standard form. */
function readSubmittedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasSubmittedRsvp(slug: string): boolean {
  return readSubmittedSlugs().includes(slug);
}

export function markRsvpSubmitted(slug: string): void {
  if (typeof window === "undefined") return;
  const slugs = readSubmittedSlugs();
  if (!slugs.includes(slug)) {
    window.localStorage.setItem(
      RSVP_SUBMITTED_SLUGS_KEY,
      JSON.stringify([...slugs, slug]),
    );
  }
}
