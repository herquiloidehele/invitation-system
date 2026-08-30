import type { GiftItem, InvitationData, PublicGuestData } from "./types";

/** A gift registry item annotated with its live reservation status. */
export interface GiftWithStatus extends GiftItem {
  status: "available" | "reserved" | "owned";
}

/** What `useGifts()` returns to a generated bundle. */
export interface GiftsApi {
  items: GiftWithStatus[];
  loading: boolean;
  pending: boolean;
  error: "conflict" | "request" | null;
  reserve: (giftItemId: string, guestName?: string) => Promise<boolean>;
  release: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

/** What `useLocale()` returns to a generated bundle. */
export interface LocaleApi {
  locale: string;
  /** Pick the active-locale value from a `{ pt: "…", en: "…" }` map. */
  t: (map: Partial<Record<string, string>>) => string;
}

/** Context carried from the host to the platform hooks. */
export interface PlatformContextValue {
  invitation: InvitationData;
  guest: PublicGuestData | null;
}

/** The full surface installed on `AiRuntime.platform` and re-exported by `@platform`. */
export interface PlatformApi {
  invitation: InvitationData;
  guest: PublicGuestData | null;
  useGifts: () => GiftsApi;
  useGuest: () => { guest: PublicGuestData | null };
  useLocale: () => LocaleApi;
}
