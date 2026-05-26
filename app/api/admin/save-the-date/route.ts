import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeJsonField } from "@/lib/json-sanitize";

export async function GET() {
  const items = await prisma.saveTheDate.findMany({
    include: { theme: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slug,
      themeId,
      couple,
      date,
      location,
      location2,
      customMessage,
      envelope,
      textStyles,
      rsvp,
      audio,
      bottomHero,
      socialPreview,
      isDemo,
      priceFromCents,
      currency,
      landingModelName,
      landingImageUrl,
      landingDescription,
      landingSubtitle,
    } = body;

    if (!slug || !themeId || !couple || !date) {
      return NextResponse.json(
        { error: "Missing required fields: slug, themeId, couple, date" },
        { status: 400 },
      );
    }

    const item = await prisma.saveTheDate.create({
      data: {
        slug,
        themeId,
        couple: sanitizeJsonField(couple, {}),
        date: sanitizeJsonField(date, {}),
        location: sanitizeJsonField(location, null),
        location2: sanitizeJsonField(location2, null),
        customMessage: customMessage || null,
        envelope: sanitizeJsonField(envelope, null),
        textStyles: sanitizeJsonField(textStyles, null),
        rsvp: sanitizeJsonField(rsvp, null),
        audio: sanitizeJsonField(audio, null),
        bottomHero: sanitizeJsonField(bottomHero, null),
        socialPreview: sanitizeJsonField(socialPreview, null),
        isDemo: isDemo === true,
        priceFromCents:
          typeof priceFromCents === "number" ? priceFromCents : null,
        currency:
          typeof currency === "string" && currency.length ? currency : "EUR",
        landingModelName:
          typeof landingModelName === "string" && landingModelName.length
            ? landingModelName
            : null,
        landingImageUrl:
          typeof landingImageUrl === "string" && landingImageUrl.length
            ? landingImageUrl
            : null,
        landingDescription:
          typeof landingDescription === "string" && landingDescription.length
            ? landingDescription
            : null,
        landingSubtitle:
          typeof landingSubtitle === "string" && landingSubtitle.length
            ? landingSubtitle
            : null,
      },
      include: { theme: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
