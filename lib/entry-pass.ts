import { buildPersonalInviteUrl } from "@/lib/guest-links";
import { buildPassUrl } from "@/lib/checkin-links";

export interface BuildEntryPassValueInput {
  origin: string;
  slug: string;
  /** Personalized guest token (?g=). Wins when present. */
  guestToken?: string;
  /** Optional guest name, used only for the personal URL's `n` param. */
  guestName?: string;
  /** Non-personalized RSVP check-in token. */
  checkInToken?: string | null;
}

/** Build the QR value: personal invite URL, else pass URL, else null. */
export function buildEntryPassValue(
  input: BuildEntryPassValueInput,
): string | null {
  if (input.guestToken) {
    return buildPersonalInviteUrl({
      origin: input.origin,
      slug: input.slug,
      token: input.guestToken,
      name: input.guestName ?? "",
    });
  }
  if (input.checkInToken) {
    return buildPassUrl(input.origin, input.slug, input.checkInToken);
  }
  return null;
}

const PASS_TOKENS_KEY = "rsvp_pass_tokens";

/** Persist a non-personalized guest's check-in token, keyed by slug. */
export function storeGuestPassToken(slug: string, checkInToken: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = JSON.parse(
      localStorage.getItem(PASS_TOKENS_KEY) ?? "{}",
    ) as Record<string, string>;
    map[slug] = checkInToken;
    localStorage.setItem(PASS_TOKENS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage/parse errors
  }
}

/** Read a stored check-in token for a slug (or null). */
export function readGuestPassToken(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const map = JSON.parse(
      localStorage.getItem(PASS_TOKENS_KEY) ?? "{}",
    ) as Record<string, unknown>;
    const value = map[slug];
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}
