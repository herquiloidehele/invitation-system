import type { PlatformApi } from "@/lib/ai-platform-types";
import type { InvitationData, PublicGuestData } from "@/lib/types";
import {
  useCalendar,
  useCountdown,
  useEntryPass,
  useGifts,
  useGuest,
  useLocale,
  useRsvp,
} from "./platform-hooks";

/**
 * Per-request holder for the invitation + guest. The provider writes it on
 * every render; `@platform`'s `invitation`/`guest` getters read it. Module-level
 * singleton is safe: an AI invitation renders one bundle at a time on the client.
 */
export const platformHolder: {
  invitation: InvitationData | null;
  guest: PublicGuestData | null;
} = { invitation: null, guest: null };

export function buildPlatformApi(): PlatformApi {
  return {
    get invitation() {
      if (!platformHolder.invitation) {
        throw new Error(
          "@platform.invitation read before PlatformProvider mounted",
        );
      }
      return platformHolder.invitation;
    },
    get guest() {
      return platformHolder.guest;
    },
    useGifts,
    useGuest,
    useLocale,
    useRsvp,
    useCountdown,
    useCalendar,
    useEntryPass,
  };
}
