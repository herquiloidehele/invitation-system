import { readPriceOverridesInput } from "@/lib/currency/price-overrides-input";
import { Prisma } from "@/lib/generated/prisma/client";
import { isObjectFit } from "@/lib/hero-media-fit";
import { normalizeInvitationEventType } from "@/lib/invitation-event-types";
import {
  normalizeInvitationLocales,
  normalizeInvitationTranslationIds,
  sanitizeInvitationTranslations,
} from "@/lib/invitation-translations";
import { sanitizeJsonField } from "@/lib/json-sanitize";
import { normalizeLandingCustomizationLevel } from "@/lib/landing-customization";
import { sanitizeLandingTranslations } from "@/lib/landing-translations";
import { sanitizeSpacingStyles } from "@/lib/spacing-styles";
import type { InvitationData } from "@/lib/types";

export type InvitationCreateBody = InvitationData & { template?: string };

export function buildInvitationCreateData(
  body: InvitationCreateBody,
  themeId: string,
): Prisma.InvitationCreateInput {
  const invitation = normalizeInvitationTranslationIds(body);

  return {
    slug: body.slug,
    theme: { connect: { id: themeId } },
    couple: body.couple as unknown as Prisma.InputJsonValue,
    date: body.date as unknown as Prisma.InputJsonValue,
    quote: body.quote ?? "",
    location: sanitizeJsonField(body.location, {}),
    location2: sanitizeJsonField(body.location2, null),
    rsvp: sanitizeJsonField(body.rsvp, { enabled: true }),
    schedule: sanitizeJsonField(invitation.schedule, []),
    scheduleStyle: body.scheduleStyle ?? "default",
    dressCode: sanitizeJsonField(invitation.dressCode, {
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
    heroHeight: typeof body.heroHeight === "number" ? body.heroHeight : null,
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
    faqs: sanitizeJsonField(invitation.faqs, null),
    guestGuide: sanitizeJsonField(body.guestGuide, null),
    envelope: sanitizeJsonField(body.envelope, null),
    saveDateStyle: body.saveDateStyle ?? null,
    cinematicImageUrl: body.cinematicImageUrl ?? null,
    sectionImages: sanitizeJsonField(body.sectionImages, null),
    coupleGallery: sanitizeJsonField(invitation.coupleGallery, null),
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
    languageSwitcherEnabled: invitation.languageSwitcherEnabled === true,
    enabledLocales: normalizeInvitationLocales(invitation.enabledLocales),
    translations: sanitizeJsonField(
      sanitizeInvitationTranslations(invitation.translations),
      null,
    ),
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
      typeof body.landingModelName === "string" && body.landingModelName.length
        ? body.landingModelName
        : null,
    landingImageUrl:
      typeof body.landingImageUrl === "string" && body.landingImageUrl.length
        ? body.landingImageUrl
        : null,
    landingDescription:
      typeof body.landingDescription === "string" &&
      body.landingDescription.length
        ? body.landingDescription
        : null,
    landingSubtitle:
      typeof body.landingSubtitle === "string" && body.landingSubtitle.length
        ? body.landingSubtitle
        : null,
    landingTranslations: sanitizeJsonField(
      sanitizeLandingTranslations(body.landingTranslations),
      null,
    ),
    landingCustomizationLevel: normalizeLandingCustomizationLevel(
      body.landingCustomizationLevel,
    ),
  };
}
