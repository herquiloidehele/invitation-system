import type { MetadataRoute } from "next";

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { prisma } from "@/lib/db";
import { getPublicLandingProductPaths } from "@/lib/landing-product-details-data";
import { buildLandingProductDetailsPath } from "@/lib/landing-product-details";
import {
  SITE_URL,
  buildAbsoluteUrl,
  buildLocalePath,
  shouldIncludePublicSitemapPage,
} from "@/lib/seo";

// Next.js route segment config — read by the framework, never imported.
// fallow-ignore-next-line unused-export
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [invitations, saveTheDates, landingProducts] = await Promise.all([
    prisma.invitation.findMany({
      where: { isDemo: true },
      select: { slug: true, updatedAt: true, isDemo: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.saveTheDate.findMany({
      where: { isDemo: true },
      select: { slug: true, updatedAt: true, isDemo: true },
      orderBy: { updatedAt: "desc" },
    }),
    getPublicLandingProductPaths(),
  ]);

  const staticEntries = SUPPORTED_LOCALES.map((locale) => ({
    url: buildAbsoluteUrl(SITE_URL, buildLocalePath("/", locale)),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: locale === "pt" ? 1 : 0.8,
  }));

  const invitationEntries = invitations
    .filter(shouldIncludePublicSitemapPage)
    .flatMap((item) =>
      SUPPORTED_LOCALES.map((locale) => ({
        url: buildAbsoluteUrl(
          SITE_URL,
          buildLocalePath(`/${item.slug}`, locale),
        ),
        lastModified: item.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    );

  const saveTheDateEntries = saveTheDates
    .filter(shouldIncludePublicSitemapPage)
    .flatMap((item) =>
      SUPPORTED_LOCALES.map((locale) => ({
        url: buildAbsoluteUrl(
          SITE_URL,
          buildLocalePath(`/s/${item.slug}`, locale),
        ),
        lastModified: item.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    );

  const landingProductEntries = landingProducts.flatMap((item) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: buildAbsoluteUrl(
        SITE_URL,
        buildLocalePath(
          buildLandingProductDetailsPath(item.kind, item.slug),
          locale,
        ),
      ),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [
    ...staticEntries,
    ...invitationEntries,
    ...saveTheDateEntries,
    ...landingProductEntries,
  ];
}
