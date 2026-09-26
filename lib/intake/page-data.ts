import { cookies } from "next/headers";

import type { AppLocale } from "@/i18n/locales";
import { CURRENCY_COOKIE, GEO_CURRENCY_COOKIE } from "@/lib/currency/config";
import { buildLocalePath } from "@/lib/seo";
import type { IntakeKind } from "./catalog";
import { whatsappPrefixForCurrency } from "./links";

// Small server-only helpers shared by the two public intake pages.

/** WhatsApp prefix guess from the currency cookies set by proxy.ts. */
export async function defaultWhatsappPrefix(): Promise<string> {
  const store = await cookies();
  return whatsappPrefixForCurrency(
    store.get(CURRENCY_COOKIE)?.value ?? store.get(GEO_CURRENCY_COOKIE)?.value,
  );
}

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
