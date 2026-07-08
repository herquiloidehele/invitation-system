import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeJsonField } from "@/lib/json-sanitize";
import { normalizeInvitationEventType } from "@/lib/invitation-event-types";
import { readPriceOverridesInput } from "@/lib/currency/price-overrides-input";
import { isObjectFit } from "@/lib/hero-media-fit";
import { normalizeLandingCustomizationLevel } from "@/lib/landing-customization";
import { sanitizeSpacingStyles } from "@/lib/spacing-styles";

// ---------------------------------------------------------------------------
// POST /api/admin/invitations — Create a new invitation
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation — accept either themeId (new) or template slug (legacy)
    if (!body.slug || !body.couple || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields: slug, couple, date" },
        { status: 400 },
      );
    }

    // Resolve themeId
    let themeId: string | undefined = body.themeId;
    if (!themeId && body.template) {
      // Legacy: look up by slug name
      const theme = await prisma.theme.findUnique({
        where: { name: body.template },
      });
      if (theme) themeId = theme.id;
    }
    if (!themeId) {
      return NextResponse.json(
        { error: "Missing required field: themeId (or template)" },
        { status: 400 },
      );
    }

    // Check for slug uniqueness
    const existing = await prisma.invitation.findUnique({
      where: { slug: body.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${body.slug}" already exists` },
        { status: 409 },
      );
    }

    const invitation = await prisma.invitation.create({
      data: {
        slug: body.slug,
        theme: { connect: { id: themeId } },
        couple: body.couple,
        date: body.date,
        quote: body.quote ?? "",
        location: sanitizeJsonField(body.location, {}),
        location2: sanitizeJsonField(body.location2, null),
        rsvp: sanitizeJsonField(body.rsvp, { enabled: true }),
        schedule: sanitizeJsonField(body.schedule, []),
        scheduleStyle: body.scheduleStyle ?? "default",
        dressCode: sanitizeJsonField(body.dressCode, {
          enabled: false,
          text: "",
        }),
        giftRegistry: sanitizeJsonField(body.giftRegistry, {
          enabled: false,
          text: "",
        }),
        audio: sanitizeJsonField(body.audio, {
          enabled: false,
          src: "",
          artist: "",
          title: "",
        }),
        heroImage: body.heroImage ?? "",
        heroHeight:
          typeof body.heroHeight === "number" ? body.heroHeight : null,
        heroOverlay: sanitizeJsonField(body.heroOverlay, null),
        heroScrollIndicator: sanitizeJsonField(body.heroScrollIndicator, null),
        heroTextLayer: sanitizeJsonField(body.heroTextLayer, null),
        imageLayer: sanitizeJsonField(body.imageLayer, null),
        videoUrl: body.videoUrl ?? null,
        videoPoster: body.videoPoster ?? null,
        heroMediaFit: isObjectFit(body.heroMediaFit) ? body.heroMediaFit : null,
        curtainVideoUrl: body.curtainVideoUrl ?? null,
        curtainVideoPoster: body.curtainVideoPoster ?? null,
        heroRevealSeconds:
          typeof body.heroRevealSeconds === "number"
            ? body.heroRevealSeconds
            : null,
        heroTopText: body.heroTopText ?? null,
        heroTapPrompt:
          typeof body.heroTapPrompt === "boolean" ? body.heroTapPrompt : true,
        faqs: sanitizeJsonField(body.faqs, null),
        guestGuide: sanitizeJsonField(body.guestGuide, null),
        envelope: sanitizeJsonField(body.envelope, null),
        saveDateStyle: body.saveDateStyle ?? null,
        cinematicImageUrl: body.cinematicImageUrl ?? null,
        sectionImages: sanitizeJsonField(body.sectionImages, null),
        coupleGallery: sanitizeJsonField(body.coupleGallery, null),
        coverVideos: sanitizeJsonField(body.coverVideos, null),
        places: sanitizeJsonField(body.places, null),
        parents: sanitizeJsonField(body.parents, null),
        ourStory: sanitizeJsonField(body.ourStory, null),
        scratchReveal: sanitizeJsonField(body.scratchReveal, null),
        heroConfetti: sanitizeJsonField(body.heroConfetti, null),
        countdown: sanitizeJsonField(body.countdown, null),
        personalGuestCard: sanitizeJsonField(body.personalGuestCard, null),
        invitationType: body.invitationType ?? "standard",
        externalLink: body.externalLink ?? "",
        isDemo: body.isDemo === true,
        textStyles: sanitizeJsonField(body.textStyles, null),
        cardStyles: sanitizeJsonField(body.cardStyles, null),
        spacingStyles: sanitizeJsonField(
          sanitizeSpacingStyles(body.spacingStyles),
          null,
        ),
        imageSettings: sanitizeJsonField(body.imageSettings, null),
        customTexts: sanitizeJsonField(body.customTexts, null),
        eventType: normalizeInvitationEventType(body.eventType),
        guestManagementEnabled: body.guestManagementEnabled === true,
        ownerCanAddGuests: body.ownerCanAddGuests === true,
        guestMessageTemplate: body.guestMessageTemplate ?? null,
        socialPreview: sanitizeJsonField(body.socialPreview, null),
        priceFromCents:
          typeof body.priceFromCents === "number" ? body.priceFromCents : null,
        discountPriceFromCents:
          typeof body.discountPriceFromCents === "number"
            ? body.discountPriceFromCents
            : null,
        currency:
          typeof body.currency === "string" && body.currency.length
            ? body.currency
            : "EUR",
        priceOverrides: readPriceOverridesInput(body.priceOverrides),
        landingModelName:
          typeof body.landingModelName === "string" &&
          body.landingModelName.length
            ? body.landingModelName
            : null,
        landingImageUrl:
          typeof body.landingImageUrl === "string" &&
          body.landingImageUrl.length
            ? body.landingImageUrl
            : null,
        landingDescription:
          typeof body.landingDescription === "string" &&
          body.landingDescription.length
            ? body.landingDescription
            : null,
        landingSubtitle:
          typeof body.landingSubtitle === "string" &&
          body.landingSubtitle.length
            ? body.landingSubtitle
            : null,
        landingCustomizationLevel: normalizeLandingCustomizationLevel(
          body.landingCustomizationLevel,
        ),
      },
      include: {
        theme: { select: { id: true, name: true, label: true } },
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("[Admin API] Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}
