import type { AppLocale } from "@/i18n/locales";
import { buildLocalePath } from "@/lib/seo";
import type { IntakeKind } from "./catalog";

// Small helpers shared by the two public intake pages.

/** Public URL of the demo the customer chose. */
export function demoPreviewHref(
  kind: IntakeKind,
  slug: string,
  locale: AppLocale,
): string {
  return buildLocalePath(
    kind === "save-the-date" ? `/s/${slug}` : `/${slug}`,
    locale,
  );
}
