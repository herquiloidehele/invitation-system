import type { LandingCustomizationLevel } from "@/lib/landing-customization";

export const LANDING_GALLERY_SETTINGS_ID = "default";
export const LANDING_FEATURE_MAX_ITEMS = 8;
export const LANDING_FEATURE_MAX_LENGTH = 60;

export type LandingGallerySettings = {
  fullyCustomizableFeatures: string[];
  preDesignedFeatures: string[];
};

export const EMPTY_LANDING_GALLERY_SETTINGS: LandingGallerySettings = {
  fullyCustomizableFeatures: [],
  preDesignedFeatures: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseLandingFeatureList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const features: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;

    const label = item.trim();
    const key = label.toLocaleLowerCase();
    if (
      !label ||
      label.length > LANDING_FEATURE_MAX_LENGTH ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    features.push(label);
    if (features.length === LANDING_FEATURE_MAX_ITEMS) break;
  }

  return features;
}

export function parseLandingGallerySettings(
  value: unknown,
): LandingGallerySettings {
  if (!isRecord(value)) {
    return {
      fullyCustomizableFeatures: [],
      preDesignedFeatures: [],
    };
  }

  return {
    fullyCustomizableFeatures: parseLandingFeatureList(
      value.fullyCustomizableFeatures,
    ),
    preDesignedFeatures: parseLandingFeatureList(value.preDesignedFeatures),
  };
}

function validateFeatureList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Feature list must be an array");
  }
  if (value.length > LANDING_FEATURE_MAX_ITEMS) {
    throw new Error(
      `Maximum ${LANDING_FEATURE_MAX_ITEMS} features per collection`,
    );
  }
  if (value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error("Feature labels cannot be blank");
  }

  const labels = value.map((item) => (item as string).trim());
  if (labels.some((label) => label.length > LANDING_FEATURE_MAX_LENGTH)) {
    throw new Error(
      `Feature labels must be ${LANDING_FEATURE_MAX_LENGTH} characters or fewer`,
    );
  }

  const keys = labels.map((label) => label.toLocaleLowerCase());
  if (new Set(keys).size !== keys.length) {
    throw new Error("Feature labels must be unique");
  }

  return labels;
}

export function validateLandingGallerySettings(
  value: unknown,
): LandingGallerySettings {
  if (!isRecord(value)) {
    throw new Error("Settings payload must be an object");
  }

  return {
    fullyCustomizableFeatures: validateFeatureList(
      value.fullyCustomizableFeatures,
    ),
    preDesignedFeatures: validateFeatureList(value.preDesignedFeatures),
  };
}

export function getFeaturesForCustomizationLevel(
  settings: LandingGallerySettings,
  level: LandingCustomizationLevel,
): string[] {
  return level === "pre_designed"
    ? settings.preDesignedFeatures
    : settings.fullyCustomizableFeatures;
}
