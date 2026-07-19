import type { Metadata } from "next";

import {
  type AppLocale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from "@/i18n/locales";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://convites.brindealstudio.com";

export function buildLocalePath(path: string, locale: AppLocale): string {
  const cleanPath = path === "/" ? "" : `/${path.replace(/^\/+/, "")}`;
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}${cleanPath}` || "/";
}

export function buildAbsoluteUrl(origin: string, path: string): string {
  const cleanOrigin = origin.replace(/\/$/, "");
  if (path === "/" || path === "") return cleanOrigin;
  return `${cleanOrigin}/${path.replace(/^\/+/, "")}`;
}

export function buildLanguageAlternates(
  origin: string,
  path: string,
  locales: readonly AppLocale[] = SUPPORTED_LOCALES,
) {
  const entries = Object.fromEntries(
    locales.map((locale) => [
      locale,
      buildAbsoluteUrl(origin, buildLocalePath(path, locale)),
    ]),
  ) as Partial<Record<AppLocale, string>>;

  return {
    ...entries,
    "x-default": buildAbsoluteUrl(
      origin,
      buildLocalePath(path, DEFAULT_LOCALE),
    ),
  };
}

export function createNoIndexMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

function createIndexableRobotsMetadata(): NonNullable<Metadata["robots"]> {
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export function createPublicPageRobotsMetadata(
  isIndexable: boolean,
): NonNullable<Metadata["robots"]> {
  if (isIndexable) return createIndexableRobotsMetadata();

  return {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  };
}

export function shouldIncludePublicSitemapPage(input: {
  isDemo: boolean | null | undefined;
}): boolean {
  return input.isDemo === true;
}

export type FaqJsonLdItem = {
  question: string;
  answer: string;
};

export type EventJsonLdInput = {
  name: string;
  description: string;
  url: string;
  startDate?: string;
  locationName?: string;
  locationAddress?: string;
  image?: string;
};

export function buildOrganizationJsonLd(origin = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Brindeal Studio",
    url: origin,
    email: "brindeal.studio@gmail.com",
    areaServed: "Portugal",
    sameAs: [],
  };
}

export function buildWebSiteJsonLd(origin = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Brindeal Studio",
    url: origin,
  };
}

export function buildServiceJsonLd(origin = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Convites digitais personalizados",
    provider: {
      "@type": "LocalBusiness",
      name: "Brindeal Studio",
      url: origin,
    },
    areaServed: "Portugal",
    serviceType: "Digital wedding invitations with online RSVP",
  };
}

export function buildFaqJsonLd(items: FaqJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildEventJsonLd(input: EventJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.startDate ? { startDate: input.startDate } : {}),
    ...(input.image ? { image: [input.image] } : {}),
    ...(input.locationName || input.locationAddress
      ? {
          location: {
            "@type": "Place",
            ...(input.locationName ? { name: input.locationName } : {}),
            ...(input.locationAddress
              ? { address: input.locationAddress }
              : {}),
          },
        }
      : {}),
  };
}
