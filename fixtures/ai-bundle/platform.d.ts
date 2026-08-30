declare module "@platform" {
  export interface GiftWithStatus {
    id: string;
    name: string;
    imageUrl?: string;
    price?: string;
    link?: string;
    status: "available" | "reserved" | "owned";
  }

  export interface GiftsApi {
    items: GiftWithStatus[];
    loading: boolean;
    pending: boolean;
    error: "conflict" | "request" | null;
    reserve: (giftItemId: string, guestName?: string) => Promise<boolean>;
    release: () => Promise<boolean>;
    refresh: () => Promise<void>;
  }

  export interface LocaleApi {
    locale: string;
    t: (map: Partial<Record<string, string>>) => string;
  }

  export interface PublicGuest {
    name: string;
    [key: string]: unknown;
  }

  export const invitation: Record<string, unknown>;
  export const guest: PublicGuest | null;
  export function useGifts(): GiftsApi;
  export function useGuest(): { guest: PublicGuest | null };
  export function useLocale(): LocaleApi;
}
