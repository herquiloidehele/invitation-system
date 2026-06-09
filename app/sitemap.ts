import type { MetadataRoute } from "next";

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { prisma } from "@/lib/db";
import {
  SITE_URL,
  buildAbsoluteUrl,
  buildLocalePath,
  shouldIncludePublicSitemapPage,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [invitations, saveTheDates] = await Promise.all([
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

  return [...staticEntries, ...invitationEntries, ...saveTheDateEntries];
}
