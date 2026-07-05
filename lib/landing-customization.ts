export const LANDING_CUSTOMIZATION_LEVELS = [
  "fully_customizable",
  "pre_designed",
] as const;

export type LandingCustomizationLevel =
  (typeof LANDING_CUSTOMIZATION_LEVELS)[number];

export const DEFAULT_LANDING_CUSTOMIZATION_LEVEL: LandingCustomizationLevel =
  "fully_customizable";

export function normalizeLandingCustomizationLevel(
  value: unknown,
): LandingCustomizationLevel {
  return value === "pre_designed"
    ? "pre_designed"
    : DEFAULT_LANDING_CUSTOMIZATION_LEVEL;
}

export function isPreDesigned(value: unknown): boolean {
  return normalizeLandingCustomizationLevel(value) === "pre_designed";
}

export function getLandingCustomizationBadge(
  value: unknown,
  preDesignedLabel: string,
): string | null {
  return isPreDesigned(value) ? preDesignedLabel : null;
}
