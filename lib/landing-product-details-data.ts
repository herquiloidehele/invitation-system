import { prisma } from "@/lib/db";
import { CURRENCY_LOCALE, type Currency } from "@/lib/currency/config";
import {
  getTemplatePriceCents,
  type PriceOverrides,
} from "@/lib/currency/template-price";
import {
  normalizeLandingCustomizationLevel,
  type LandingCustomizationLevel,
} from "@/lib/landing-customization";
import { resolveLandingGalleryMetadata } from "@/lib/landing-gallery-metadata";
import { resolveLandingPrice, type LandingPrice } from "@/lib/landing-price";
import {
  buildLandingProductDetailsPath,
  resolveLandingDetailImages,
  type LandingProductKind,
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

function readCoupleGalleryUrls(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const images = (value as { images?: unknown }).images;
  if (!Array.isArray(images)) return [];

  return images.flatMap((image) => {
    if (!image || typeof image !== "object" || Array.isArray(image)) return [];
    const src = (image as { src?: unknown }).src;
    return typeof src === "string" ? [src] : [];
  });
}

function readSaveTheDateBottomImage(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const hero = value as {
    enabled?: unknown;
    mediaType?: unknown;
    mediaUrl?: unknown;
  };
  return hero.enabled === true &&
    hero.mediaType === "image" &&
    typeof hero.mediaUrl === "string"
    ? hero.mediaUrl
    : undefined;
}

function resolvePrice(target: ProductRow, viewerCurrency: Currency) {
  const { fromCents, discountCents } = getTemplatePriceCents(
    target,
    target.priceOverrides as PriceOverrides | null,
    viewerCurrency,
  );
  return resolveLandingPrice(
    fromCents,
    discountCents,
    viewerCurrency,
    CURRENCY_LOCALE[viewerCurrency],
  );
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
  const fallbackUrls =
    kind === "convite"
      ? [
          (target as InvitationProductRow).heroImage,
          ...readCoupleGalleryUrls(
            (target as InvitationProductRow).coupleGallery,
          ),
        ]
      : [
          readSaveTheDateBottomImage(
            (target as SaveTheDateProductRow).bottomHero,
          ),
        ];
  const title = metadata.title;

  return {
    kind,
    slug,
    title,
    subtitle: localized.landingSubtitle?.trim() || null,
    description: metadata.description,
    customizationLevel: normalizeLandingCustomizationLevel(
      target.landingCustomizationLevel,
    ),
    price: resolvePrice(target, viewerCurrency),
    images: resolveLandingDetailImages({
      dedicated: target.landingDetailImages,
      landingImageUrl: target.landingImageUrl,
      fallbackUrls,
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
