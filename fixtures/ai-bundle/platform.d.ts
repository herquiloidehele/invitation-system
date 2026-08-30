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

  export interface RsvpCustomField {
    id: string;
    label: string;
    type: "text" | "textarea" | "switch" | "radio" | "select";
    required: boolean;
    visibility: "always" | "attending";
    options?: Array<{ id: string; label: string }>;
  }

  export interface RsvpFieldsDescriptor {
    email: boolean;
    companion: boolean;
    numAdults: boolean;
    numChildren: boolean;
    dietaryRestrictions: boolean;
    custom: RsvpCustomField[];
  }

  export interface RsvpValues {
    name: string;
    email: string;
    attending: boolean | null;
    companion: string;
    dietaryRestrictions: string;
    numAdults: number;
    numChildren: number;
    message: string;
    custom: Record<string, unknown>;
  }

  export interface RsvpApi {
    fields: RsvpFieldsDescriptor;
    values: RsvpValues;
    setValue: <K extends keyof RsvpValues>(key: K, value: RsvpValues[K]) => void;
    setCustom: (fieldId: string, value: unknown) => void;
    errors: Record<string, string>;
    status:
      | "idle"
      | "submitting"
      | "success"
      | "error"
      | "closed"
      | "already_submitted";
    submit: () => Promise<{ ok: boolean; checkInToken: string | null }>;
  }

  export const invitation: Record<string, unknown>;
  export const guest: PublicGuest | null;
  export function useGifts(): GiftsApi;
  export function useGuest(): { guest: PublicGuest | null };
  export function useLocale(): LocaleApi;
  export function useRsvp(): RsvpApi;
}
