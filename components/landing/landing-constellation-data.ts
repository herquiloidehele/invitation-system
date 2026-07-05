export type ConstellationGroupKey =
  | "entrance"
  | "story"
  | "guide"
  | "organize";

export type ConstellationFeatureKey =
  | "animatedEntrance"
  | "music"
  | "customDesign"
  | "socialPreview"
  | "countdown"
  | "schedule"
  | "coupleStory"
  | "photoGallery"
  | "dressCode"
  | "maps"
  | "calendar"
  | "giftRegistry"
  | "guestGuide"
  | "faqs"
  | "languages"
  | "personalizedRsvp"
  | "partyResponses"
  | "dietaryNotes"
  | "customAnswers"
  | "guestTracking"
  | "whatsapp"
  | "excelExport";

export type ConstellationGroup = {
  key: ConstellationGroupKey;
  features: readonly ConstellationFeatureKey[];
};

export type ConstellationPreview = {
  id: string;
  title: string;
  href: string;
};

export function getConstellationPreview(
  items: readonly ConstellationPreview[],
): ConstellationPreview | null {
  return items[0] ?? null;
}

export const CONSTELLATION_GROUPS = [
  {
    key: "entrance",
    features: [
      "animatedEntrance",
      "music",
      "customDesign",
      "socialPreview",
    ],
  },
  {
    key: "story",
    features: [
      "countdown",
      "schedule",
      "coupleStory",
      "photoGallery",
      "dressCode",
    ],
  },
  {
    key: "guide",
    features: [
      "maps",
      "calendar",
      "giftRegistry",
      "guestGuide",
      "faqs",
      "languages",
    ],
  },
  {
    key: "organize",
    features: [
      "personalizedRsvp",
      "partyResponses",
      "dietaryNotes",
      "customAnswers",
      "guestTracking",
      "whatsapp",
      "excelExport",
    ],
  },
] as const satisfies readonly ConstellationGroup[];
