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
    <div className="flex items-center gap-1 rounded-full border border-[#E5E7E4] bg-white/80 p-1 text-xs font-semibold text-[#5C605A]">
      {SUPPORTED_LOCALES.map((nextLocale) => (
        <a
          key={nextLocale}
          href={buildLocaleHref(pathname, nextLocale)}
          aria-current={locale === nextLocale ? "true" : undefined}
          aria-label={t(nextLocale)}
          className={`rounded-full px-2 py-1 transition sm:px-2.5 ${
            locale === nextLocale
              ? "bg-[#3F4E3F] text-white"
              : "hover:bg-[#F6F7F5] hover:text-[#1F2420]"
          }`}
        >
          {nextLocale.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
