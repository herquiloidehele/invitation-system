import { prisma } from "@/lib/db";
import { type Currency, CURRENCY_LOCALE } from "@/lib/currency/config";
import { getTemplatePriceCents, type PriceOverrides } from "@/lib/currency/template-price";
import { type LandingCustomizationLevel, normalizeLandingCustomizationLevel } from "@/lib/landing-customization";
import { resolveLandingGalleryMetadata } from "@/lib/landing-gallery-metadata";
import { type LandingPrice, resolveLandingPrice } from "@/lib/landing-price";
import {
  buildLandingProductDetailsPath,
  type LandingProductKind,
  resolveLandingDetailImages
} from "@/lib/landing-product-details";
import { localizeLandingMetadata } from "@/lib/landing-translations";
import { buildPurchaseMessage, buildWhatsappUrl } from "@/lib/landing-whatsapp";
import type { AppLocale } from "@/i18n/locales";

export type LandingProductDetails = {
  kind: LandingProductKind;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  customizationLevel: LandingCustomizationLevel;
  price: LandingPrice | null;
  /**
   * Raw effective price for structured data. `price` above holds only
   * formatted display strings, which schema.org cannot consume.
   */
  offer: { priceCents: number; currency: Currency } | null;
  images: string[];
  previewHref: string;
  detailsHref: string;
  whatsappHref: string;
};

const productSelect = {
  slug: true,
  couple: true,
  landingModelName: true,
  landingSubtitle: true,
  landingDescription: true,
  landingTranslations: true,
  landingCustomizationLevel: true,
  landingDetailImages: true,
  landingImageUrl: true,
  priceFromCents: true,
  discountPriceFromCents: true,
  currency: true,
  priceOverrides: true,
} as const;

const publicProductInclude = {
  invitation: {
    select: {
      ...productSelect,
      heroImage: true,
      coupleGallery: true,
    },
  },
  saveTheDate: {
    select: {
      ...productSelect,
      bottomHero: true,
    },
  },
} as const;

type ProductRow = {
  slug: string;
  couple: unknown;
  landingModelName: string | null;
  landingSubtitle: string | null;
  landingDescription: string | null;
  landingTranslations: unknown;
  landingCustomizationLevel: string;
  landingDetailImages: unknown;
  landingImageUrl: string | null;
  priceFromCents: number | null;
  discountPriceFromCents: number | null;
  currency: string;
  priceOverrides: unknown;
};

type InvitationProductRow = ProductRow & {
  heroImage: string;
  coupleGallery: unknown;
};

type SaveTheDateProductRow = ProductRow & {
  bottomHero: unknown;
};

type PublicFeatureRow = {
  invitation: InvitationProductRow | null;
  saveTheDate: SaveTheDateProductRow | null;
};

function resolvePricing(target: ProductRow, viewerCurrency: Currency) {
  const { fromCents, discountCents } = getTemplatePriceCents(
    target,
    target.priceOverrides as PriceOverrides | null,
    viewerCurrency,
  );

  const price = resolveLandingPrice(
    fromCents,
    discountCents,
    viewerCurrency,
    CURRENCY_LOCALE[viewerCurrency],
  );

  // The effective price is the discount when it is a real reduction, matching
  // the rule resolveLandingPrice applies for the struck-through original.
  const effectiveCents =
    discountCents != null && fromCents != null && discountCents < fromCents
      ? discountCents
      : fromCents;

  return {
    price,
    offer:
      effectiveCents != null && effectiveCents > 0
        ? { priceCents: effectiveCents, currency: viewerCurrency }
        : null,
  };
}

export async function getLandingProductDetails(
  kind: LandingProductKind,
  slug: string,
  viewerCurrency: Currency,
  locale: AppLocale,
): Promise<LandingProductDetails | null> {
  const row = (await prisma.landingFeature.findFirst({
    where:
      kind === "convite"
        ? { enabled: true, invitation: { is: { slug } } }
        : { enabled: true, saveTheDate: { is: { slug } } },
    include: publicProductInclude,
  })) as unknown as PublicFeatureRow | null;

  if (!row) return null;
  const target = kind === "convite" ? row.invitation : row.saveTheDate;
  if (!target) return null;

  const localized = localizeLandingMetadata(target, locale);
  const metadata = resolveLandingGalleryMetadata({
    couple: localized.couple,
    landingModelName: localized.landingModelName,
    landingDescription: localized.landingDescription,
  });

  const title = metadata.title;
  const pricing = resolvePricing(target, viewerCurrency);

  return {
    kind,
    slug,
    title,
    subtitle: localized.landingSubtitle?.trim() || null,
    description: metadata.description,
    customizationLevel: normalizeLandingCustomizationLevel(
      target.landingCustomizationLevel,
    ),
    price: pricing.price,
    offer: pricing.offer,
    images: resolveLandingDetailImages({
      dedicated: target.landingDetailImages,
      landingImageUrl: target.landingImageUrl,
    }),
    previewHref: kind === "convite" ? `/${slug}` : `/s/${slug}`,
    detailsHref: buildLandingProductDetailsPath(kind, slug),
    whatsappHref: buildWhatsappUrl(buildPurchaseMessage(title)),
  };
}

export async function getPublicLandingProductPaths(): Promise<
  Array<{ kind: LandingProductKind; slug: string }>
> {
  const rows = await prisma.landingFeature.findMany({
    where: { enabled: true },
    select: {
      invitation: { select: { slug: true } },
      saveTheDate: { select: { slug: true } },
    },
  });
  const paths: Array<{ kind: LandingProductKind; slug: string }> = [];
  for (const row of rows) {
    if (row.invitation) {
      paths.push({ kind: "convite", slug: row.invitation.slug });
      continue;
    }
    if (row.saveTheDate) {
      paths.push({ kind: "save-the-date", slug: row.saveTheDate.slug });
    }
  }

  return paths.filter(
    (path, index) =>
      paths.findIndex(
        (candidate) =>
          candidate.kind === path.kind && candidate.slug === path.slug,
      ) === index,
  );
}
