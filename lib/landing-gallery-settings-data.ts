import { prisma } from "@/lib/db";
import {
  LANDING_GALLERY_SETTINGS_ID,
  parseLandingGallerySettings,
  type LandingGallerySettings,
} from "@/lib/landing-gallery-settings";

export async function getLandingGallerySettings(): Promise<LandingGallerySettings> {
  const row = await prisma.landingGallerySettings.findUnique({
    where: { id: LANDING_GALLERY_SETTINGS_ID },
  });

  return parseLandingGallerySettings(row);
}
