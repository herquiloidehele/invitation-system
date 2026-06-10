export function resolveSelectedRsvpSlug<T extends { slug: string }>(
  selectedSlug: string | null | undefined,
  items: T[],
): string | null {
  if (selectedSlug && items.some((item) => item.slug === selectedSlug)) {
    return selectedSlug;
  }
  return items[0]?.slug ?? null;
}
