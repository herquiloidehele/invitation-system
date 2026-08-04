import type { CSSProperties } from "react";
import { getBackgroundImageStyle } from "./image-settings";
import { DEFAULT_IMAGE_SETTINGS, type ImageSettings } from "./types";

const READABILITY_WASH = "rgba(255, 255, 255, 0.2)";

/**
 * Resolve the optional shared Save the Date background image into CSS.
 * The caller supplies the normal card background separately so an empty URL
 * preserves each layout's existing no-image appearance.
 */
export function getSaveTheDateBackgroundStyle(
  imageUrl: string | undefined,
  settings: ImageSettings = DEFAULT_IMAGE_SETTINGS,
): CSSProperties {
  const trimmedUrl = imageUrl?.trim();
  if (!trimmedUrl) return {};

  return {
    backgroundImage: `linear-gradient(${READABILITY_WASH}, ${READABILITY_WASH}), url(${JSON.stringify(trimmedUrl)})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    ...getBackgroundImageStyle(
      { saveTheDateBackground: settings },
      "saveTheDateBackground",
    ),
  };
}
