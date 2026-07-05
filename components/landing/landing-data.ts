import type {
  GalleryCategory as DbGalleryCategory,
  GalleryFeature,
} from "@/lib/landing-features";

export type GalleryCategoryKey =
  | "all"
  | "wedding"
  | "saveTheDate"
  | "baptism"
  | "anniversary"
  | "engagement";

export type GalleryCategoryTab = { key: GalleryCategoryKey; label: string };

export type GalleryItemsByCategory = Record<
  DbGalleryCategory,
  GalleryFeature[]
>;

export type GalleryCustomizationGroups = {
  fullyCustomizable: GalleryItemsByCategory;
  preDesigned: GalleryItemsByCategory;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const dbCategoryToTabKey: Record<DbGalleryCategory, GalleryCategoryKey> =
  {
    wedding: "wedding",
    save_the_date: "saveTheDate",
    baptism: "baptism",
    anniversary: "anniversary",
    engagement: "engagement",
  };

const tabKeyToDbCategory: Record<
  Exclude<GalleryCategoryKey, "all">,
  DbGalleryCategory
> = {
  wedding: "wedding",
  saveTheDate: "save_the_date",
  baptism: "baptism",
  anniversary: "anniversary",
  engagement: "engagement",
};

export type LandingTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  raw?(key: string): unknown;
};

export function getNavLinks(t: (key: string) => string) {
  return [
    { label: t("bestSellers"), href: "#destaques" },
    { label: t("gallery"), href: "#modelos" },
    { label: t("process"), href: "#processo" },
    { label: t("features"), href: "#recursos" },
    { label: t("faq"), href: "#faq" },
  ];
}

function getGalleryCategories(
  t: (key: string) => string,
): GalleryCategoryTab[] {
  return [
    { key: "all", label: t("categories.all") },
    { key: "wedding", label: t("categories.wedding") },
    { key: "saveTheDate", label: t("categories.saveTheDate") },
    { key: "baptism", label: t("categories.baptism") },
    { key: "anniversary", label: t("categories.anniversary") },
    { key: "engagement", label: t("categories.engagement") },
  ];
}

export function getVisibleGalleryCategories(
  t: (key: string) => string,
  itemsByCategory: Record<DbGalleryCategory, GalleryFeature[]>,
): GalleryCategoryTab[] {
  const populatedCategories = getGalleryCategories(t).filter(
    (category) =>
      category.key !== "all" &&
      itemsByCategory[tabKeyToDbCategory[category.key]].length > 0,
  );

  if (populatedCategories.length <= 1) return [];

  return [{ key: "all", label: t("categories.all") }, ...populatedCategories];
}

const galleryCategoryKeys: DbGalleryCategory[] = [
  "wedding",
  "save_the_date",
  "baptism",
  "anniversary",
  "engagement",
];

function emptyGalleryItemsByCategory(): GalleryItemsByCategory {
  return {
    wedding: [],
    save_the_date: [],
    baptism: [],
    anniversary: [],
    engagement: [],
  };
}

export function groupGalleryByCustomization(
  itemsByCategory: GalleryItemsByCategory,
): GalleryCustomizationGroups {
  const groups: GalleryCustomizationGroups = {
    fullyCustomizable: emptyGalleryItemsByCategory(),
    preDesigned: emptyGalleryItemsByCategory(),
  };

  for (const category of galleryCategoryKeys) {
    for (const item of itemsByCategory[category]) {
      const target =
        item.customizationLevel === "pre_designed"
          ? groups.preDesigned
          : groups.fullyCustomizable;
      target[category].push(item);
    }
  }

  return groups;
}

export function getPopulatedGalleryCategoryKeys(
  itemsByCategory: GalleryItemsByCategory,
): DbGalleryCategory[] {
  return galleryCategoryKeys.filter(
    (category) => itemsByCategory[category].length > 0,
  );
}

export function getProcessSteps(t: LandingTranslator) {
  return t.raw?.("steps") as ReadonlyArray<readonly [string, string, string]>;
}

export function getProcessBadges(t: LandingTranslator) {
  return t.raw?.("badges") as ReadonlyArray<string>;
}

export function getFaqs(t: LandingTranslator, urgencyPrice: string): FaqItem[] {
  const items = (t.raw?.("items") as FaqItem[]) ?? [];
  const urgency: FaqItem = {
    question: t("urgency.question"),
    answer: t("urgency.answer", { price: urgencyPrice }),
  };
  // Insert right after the turnaround FAQ (index 0); empty list -> just urgency.
  return [...items.slice(0, 1), urgency, ...items.slice(1)];
}
