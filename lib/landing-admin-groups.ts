import {
  normalizeLandingCustomizationLevel,
  type LandingCustomizationLevel,
} from "@/lib/landing-customization";

type ItemWithCustomizationLevel = {
  customizationLevel?: unknown;
};

export function filterPickablesForCustomizationLevel<
  T extends ItemWithCustomizationLevel & { id: string },
>(
  items: T[],
  level: LandingCustomizationLevel,
  placedIds: ReadonlySet<string>,
): T[] {
  return items.filter(
    (item) =>
      normalizeLandingCustomizationLevel(item.customizationLevel) === level &&
      !placedIds.has(item.id),
  );
}

export function groupGalleryFeaturesByCustomizationLevel<
  T extends ItemWithCustomizationLevel,
>(items: T[]): { fullyCustomizable: T[]; preDesigned: T[] } {
  const fullyCustomizable: T[] = [];
  const preDesigned: T[] = [];

  for (const item of items) {
    if (
      normalizeLandingCustomizationLevel(item.customizationLevel) ===
      "pre_designed"
    ) {
      preDesigned.push(item);
    } else {
      fullyCustomizable.push(item);
    }
  }

  return { fullyCustomizable, preDesigned };
}
