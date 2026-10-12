import type { Metadata } from "next";

import type { AppLocale } from "@/i18n/locales";
import { createNoIndexMetadata } from "@/lib/seo";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/social-preview";

/** Link preview card shown when an intake link is shared (e.g. on WhatsApp). */
export const INTAKE_OG_IMAGE_PATH = "/images/intake-link-preview-image.jpg";

/**
 * Metadata shared by both intake entry points. The pages stay out of search
 * indexes; the preview only matters when the studio sends the link.
 */
export function buildIntakeMetadata(
  {
    title,
    description,
    locale,
  }: { title: string; description: string; locale: AppLocale },
  siteOrigin: string,
): Metadata {
  const image = `${siteOrigin}${INTAKE_OG_IMAGE_PATH}`;

  return {
    ...createNoIndexMetadata(),
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
