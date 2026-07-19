import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeJsonField } from "@/lib/json-sanitize";
import { readPriceOverridesInput } from "@/lib/currency/price-overrides-input";
import { normalizeLandingCustomizationLevel } from "@/lib/landing-customization";
import { sanitizeLandingTranslations } from "@/lib/landing-translations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = await prisma.saveTheDate.findUnique({
    where: { id },
    include: { theme: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();

    const existing = await prisma.saveTheDate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.saveTheDate.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.themeId !== undefined && { themeId: body.themeId }),
        ...(body.couple !== undefined && {
          couple: sanitizeJsonField(body.couple, existing.couple),
        }),
        ...(body.date !== undefined && {
          date: sanitizeJsonField(body.date, existing.date),
        }),
        ...(body.location !== undefined && {
          location: sanitizeJsonField(body.location, null),
        }),
        ...(body.location2 !== undefined && {
          location2: sanitizeJsonField(body.location2, null),
        }),
        ...(body.customMessage !== undefined && {
          customMessage: body.customMessage || null,
        }),
        ...(body.envelope !== undefined && {
          envelope: sanitizeJsonField(body.envelope, null),
        }),
        ...(body.textStyles !== undefined && {
          textStyles: sanitizeJsonField(body.textStyles, null),
        }),
        ...(body.rsvp !== undefined && {
          rsvp: sanitizeJsonField(body.rsvp, null),
        }),
        ...(body.audio !== undefined && {
          audio: sanitizeJsonField(body.audio, null),
        }),
        ...(body.bottomHero !== undefined && {
          bottomHero: sanitizeJsonField(body.bottomHero, null),
        }),
        ...(body.socialPreview !== undefined && {
          socialPreview: sanitizeJsonField(body.socialPreview, null),
        }),
        ...(body.isDemo !== undefined && {
          isDemo: body.isDemo === true,
        }),
        ...(body.priceFromCents !== undefined && {
          priceFromCents:
            typeof body.priceFromCents === "number"
              ? body.priceFromCents
              : null,
        }),
        ...(body.discountPriceFromCents !== undefined && {
          discountPriceFromCents:
            typeof body.discountPriceFromCents === "number"
              ? body.discountPriceFromCents
              : null,
        }),
        ...(body.currency !== undefined && {
          currency:
            typeof body.currency === "string" && body.currency.length
              ? body.currency
              : "EUR",
        }),
        ...(body.priceOverrides !== undefined && {
          priceOverrides: readPriceOverridesInput(body.priceOverrides),
        }),
        ...(body.landingModelName !== undefined && {
          landingModelName:
            typeof body.landingModelName === "string" &&
            body.landingModelName.length
              ? body.landingModelName
              : null,
        }),
        ...(body.landingImageUrl !== undefined && {
          landingImageUrl:
            typeof body.landingImageUrl === "string" &&
            body.landingImageUrl.length
              ? body.landingImageUrl
              : null,
        }),
        ...(body.landingDescription !== undefined && {
          landingDescription:
            typeof body.landingDescription === "string" &&
            body.landingDescription.length
              ? body.landingDescription
              : null,
        }),
        ...(body.landingSubtitle !== undefined && {
          landingSubtitle:
            typeof body.landingSubtitle === "string" &&
            body.landingSubtitle.length
              ? body.landingSubtitle
              : null,
        }),
        ...(body.landingTranslations !== undefined && {
          landingTranslations: sanitizeJsonField(
            sanitizeLandingTranslations(body.landingTranslations),
            null,
          ),
        }),
        ...(body.landingCustomizationLevel !== undefined && {
          landingCustomizationLevel: normalizeLandingCustomizationLevel(
            body.landingCustomizationLevel,
          ),
        }),
      },
      include: { theme: true },
    });
    return NextResponse.json(item);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.saveTheDate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
