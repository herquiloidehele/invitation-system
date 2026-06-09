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

export type GalleryCategory = { key: GalleryCategoryKey; label: string };

export type FaqItem = {
  question: string;
  answer: string;
};

export const dbCategoryToTabKey: Record<DbGalleryCategory, GalleryCategoryKey> = {
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

export function getGalleryCategories(
  t: (key: string) => string,
): GalleryCategory[] {
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
): GalleryCategory[] {
  const populatedCategories = getGalleryCategories(t).filter(
    (category) =>
      category.key !== "all" &&
      itemsByCategory[tabKeyToDbCategory[category.key]].length > 0,
  );

  if (populatedCategories.length <= 1) return [];

  return [{ key: "all", label: t("categories.all") }, ...populatedCategories];
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
