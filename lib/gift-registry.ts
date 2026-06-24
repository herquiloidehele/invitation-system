import type { GiftRegistry } from "@/lib/types";

/** True when the registry has at least one product to show on the grid page. */
export function hasGiftItems(
  registry: Pick<GiftRegistry, "items"> | null | undefined,
): boolean {
  return Boolean(registry?.items && registry.items.length > 0);
}

/** Locale-less path to the gifts page, preserving the guest token when present. */
export function giftsPagePath(slug: string, guestToken?: string | null): string {
  const query = guestToken ? `?g=${encodeURIComponent(guestToken)}` : "";
  return `/${slug}/gifts${query}`;
}
