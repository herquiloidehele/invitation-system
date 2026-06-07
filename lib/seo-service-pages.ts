import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { buildLocalePath } from "@/lib/seo";

export const SERVICE_PAGE_SLUGS = ["save-the-date-digital"] as const;

export function getServicePageSitemapPaths(): string[] {
  return SERVICE_PAGE_SLUGS.flatMap((slug) =>
    SUPPORTED_LOCALES.map((locale) => buildLocalePath(`/${slug}`, locale)),
  );
}
