import type { CSSProperties } from "react";
import {
  type ImageSettings,
  type ImageSettingsKey,
  type ImageSettingsMap,
  DEFAULT_IMAGE_SETTINGS,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Resolve image settings for a given key, falling back to defaults.
// ---------------------------------------------------------------------------

export function resolveImageSettings(
  map: ImageSettingsMap | undefined,
  key: ImageSettingsKey,
): ImageSettings {
  return map?.[key] ?? DEFAULT_IMAGE_SETTINGS;
}

// ---------------------------------------------------------------------------
// Build the inline CSS properties for an <img> or background element
// that should honour the stored position & zoom.
//
// The caller should ensure the parent container has `overflow: hidden`.
// The image element should use `object-fit: cover` (already applied).
// ---------------------------------------------------------------------------

export function getImageStyle(
  map: ImageSettingsMap | undefined,
  key: ImageSettingsKey,
): CSSProperties {
  const s = resolveImageSettings(map, key);

  // Nothing customised — skip extra style to avoid unnecessary work.
  if (s.positionX === 50 && s.positionY === 50 && s.zoom === 1) {
    return {};
  }

  return {
    objectPosition: `${s.positionX}% ${s.positionY}%`,
    transform: s.zoom !== 1 ? `scale(${s.zoom})` : undefined,
    transformOrigin: `${s.positionX}% ${s.positionY}%`,
  };
}

// ---------------------------------------------------------------------------
// Same as above but returns properties suitable for a CSS background-image
// container (used by the cinematic Save the Date section).
// ---------------------------------------------------------------------------

export function getBackgroundImageStyle(
  map: ImageSettingsMap | undefined,
  key: ImageSettingsKey,
): CSSProperties {
  const s = resolveImageSettings(map, key);

  if (s.positionX === 50 && s.positionY === 50 && s.zoom === 1) {
    return {};
  }

  return {
    backgroundPosition: `${s.positionX}% ${s.positionY}%`,
    backgroundSize: s.zoom !== 1 ? `${s.zoom * 100}%` : undefined,
  };
}
