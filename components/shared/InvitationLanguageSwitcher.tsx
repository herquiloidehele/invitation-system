"use client";

import {
  createContext,
  useContext,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import type { AppLocale } from "@/i18n/locales";
import { resolveLocale } from "@/i18n/locales";
import { buildInvitationLocaleSwitchHref } from "@/lib/invitation-language-routing";
import {
  getEffectiveInvitationLocales,
  shouldShowInvitationLanguageSwitcher,
} from "@/lib/invitation-translations";
import type { InvitationData } from "@/lib/types";

const PreviewLocaleChangeContext = createContext<
  ((locale: AppLocale) => void) | null
>(null);

export function InvitationLanguagePreviewProvider({
  onLocaleChange,
  children,
}: {
  onLocaleChange: (locale: AppLocale) => void;
  children: ReactNode;
}) {
  return (
    <PreviewLocaleChangeContext.Provider value={onLocaleChange}>
      {children}
    </PreviewLocaleChangeContext.Provider>
  );
}

const LABELS: Record<AppLocale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

const optionClassName =
  "grid min-h-9 min-w-9 place-items-center rounded-full px-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50";

export function InvitationLanguageSwitcher({
  invitation,
}: {
  invitation: InvitationData;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = resolveLocale(useLocale());
  const onPreviewLocaleChange = useContext(PreviewLocaleChangeContext);

  if (!shouldShowInvitationLanguageSwitcher(invitation)) return null;

  const stopPropagation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <nav
      aria-label="Language"
      className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex rounded-full border border-white/30 bg-black/45 p-1 text-white shadow-lg backdrop-blur-md"
      onClick={stopPropagation}
    >
      {getEffectiveInvitationLocales(invitation).map((locale) => {
        const active = locale === currentLocale;
        const className = `${optionClassName} ${
          active
            ? "bg-white text-neutral-950 shadow-sm"
            : "text-white/75 hover:bg-white/15 hover:text-white"
        }`;
        const commonProps = {
          "aria-current": active ? ("page" as const) : undefined,
          "aria-label": LABELS[locale],
          className,
        };

        return onPreviewLocaleChange ? (
          <button
            key={locale}
            type="button"
            {...commonProps}
            onClick={(event) => {
              event.stopPropagation();
              onPreviewLocaleChange(locale);
            }}
          >
            {locale}
          </button>
        ) : (
          <a
            key={locale}
            {...commonProps}
            href={buildInvitationLocaleSwitchHref(
              pathname,
              searchParams.toString(),
              locale,
            )}
            onClick={stopPropagation}
          >
            {locale}
          </a>
        );
      })}
    </nav>
  );
}
