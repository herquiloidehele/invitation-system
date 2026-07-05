import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  LANDING_GALLERY_SETTINGS_ID,
  validateLandingGallerySettings,
} from "@/lib/landing-gallery-settings";
import { getLandingGallerySettings } from "@/lib/landing-gallery-settings-data";

export async function GET() {
  return NextResponse.json(await getLandingGallerySettings());
}

export async function PUT(request: NextRequest) {
  try {
    const settings = validateLandingGallerySettings(await request.json());
    const row = await prisma.landingGallerySettings.upsert({
      where: { id: LANDING_GALLERY_SETTINGS_ID },
      create: { id: LANDING_GALLERY_SETTINGS_ID, ...settings },
      update: settings,
    });

    return NextResponse.json(validateLandingGallerySettings(row));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid gallery settings",
      },
      { status: 400 },
    );
  }
}
