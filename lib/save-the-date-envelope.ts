import type { EnvelopeConfig } from "./types";
import type { STDEnvelopeTheme } from "./save-the-date";

export function getSaveTheDateEnvelopeCoverBackground(
  themeEnvelope: STDEnvelopeTheme,
  overrides: EnvelopeConfig | null | undefined,
): string {
  return overrides?.coverBackground || overrides?.base || themeEnvelope.base;
}
