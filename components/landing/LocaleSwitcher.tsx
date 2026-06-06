"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import {
  type AppLocale,
  buildLocaleHref,
  SUPPORTED_LOCALES,
} from "@/i18n/locales";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const t = useTranslations("Locale");

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 text-xs font-semibold text-muted-foreground">
      {SUPPORTED_LOCALES.map((nextLocale) => (
        <a
          key={nextLocale}
          href={buildLocaleHref(pathname, nextLocale)}
          aria-current={locale === nextLocale ? "true" : undefined}
          aria-label={t(nextLocale)}
          className={`rounded-full px-2 py-1 transition sm:px-2.5 ${
            locale === nextLocale
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted hover:text-foreground"
          }`}
        >
          {nextLocale.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
