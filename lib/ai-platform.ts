import type { GiftAvailability } from "./gift-reservation-domain";
import type { GiftItem } from "./types";
import type { GiftWithStatus } from "./ai-platform-types";

/**
 * Pick the value for `locale` from a per-locale string map, falling back to
 * `fallbackLocale`, then to the first present value, then to "". Backs the
 * bundle's `t()` — the agent authors `{ pt: "…", en: "…" }` maps.
 */
export function pickLocaleValue(
  map: Partial<Record<string, string>>,
  locale: string,
  fallbackLocale: string,
): string {
  const direct = map[locale];
  if (typeof direct === "string") return direct;
  const fallback = map[fallbackLocale];
  if (typeof fallback === "string") return fallback;
  for (const key of Object.keys(map)) {
    const value = map[key];
    if (typeof value === "string") return value;
  }
  return "";
}

/**
 * Annotate gift registry items with their live reservation status. Items with
 * no availability row default to "available". Order is preserved.
 */
export function mergeGiftItems(
  items: GiftItem[],
  availability: GiftAvailability[],
): GiftWithStatus[] {
  const statusById = new Map(availability.map((a) => [a.giftItemId, a.status]));
  return items.map((item) => ({
    ...item,
    status: statusById.get(item.id) ?? "available",
  }));
}
