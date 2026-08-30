import { hostRuntime } from "../runtime";

// The host installs the real PlatformApi here. tsc validates the fixture's
// `@platform` imports against platform.d.ts (the ambient contract), not against
// this shim — esbuild only aliases `@platform` to this file at build time.
const platform = hostRuntime().platform;

// Value getters — the host holder is populated before the bundle renders.
export const invitation = platform.invitation;
export const guest = platform.guest;

// Hooks.
export const useGifts = platform.useGifts;
export const useGuest = platform.useGuest;
export const useLocale = platform.useLocale;
export const useRsvp = platform.useRsvp;
export const useCountdown = platform.useCountdown;
export const useCalendar = platform.useCalendar;
export const useEntryPass = platform.useEntryPass;
export const useAudio = platform.useAudio;
