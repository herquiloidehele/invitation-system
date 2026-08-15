"use client";

import { useCallback, useMemo, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";

import type { AppLocale } from "@/i18n/locales";
import { getClientMessages } from "@/i18n/client-messages";
import { InvitationLocaleChangeProvider } from "@/components/shared/InvitationLanguageSwitcher";
import { buildInvitationLocaleReplaceUrl } from "@/lib/invitation-language-routing";
import {
  localizeInvitation,
  supportsInvitationTranslations,
} from "@/lib/invitation-translations";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import InvitationView from "./InvitationView";

interface InvitationLocaleControllerProps {
  /** Untranslated record, including its `translations` overlay. */
  sourceInvitation: InvitationData;
  /** Locale from the URL — what the server rendered. */
  initialLocale: AppLocale;
  theme: TemplateTheme;
  isLandingPreview?: boolean;
  lazyExternalIframe?: boolean;
  initialSection?: string;
}

/**
 * Swaps the invitation's language in place.
 *
 * A navigation would remount everything below `[locale]` — the router cache key
 * of a dynamic path segment changes, so React recreates the tree. That replays
 * the curtain/video entrance, refetches the Canva document, stops the audio and
 * resets scroll. Instead we keep the URL segment fixed, re-derive the content
 * with the pure `localizeInvitation`, and swap the message bundle.
 *
 * The server rendered `initialLocale`, and this initialises to the same value,
 * so the first client render is identical and hydration is clean.
 */
export default function InvitationLocaleController({
  sourceInvitation,
  initialLocale,
  theme,
  isLandingPreview = false,
  lazyExternalIframe = false,
  initialSection,
}: InvitationLocaleControllerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<AppLocale>(initialLocale);

  const invitation = useMemo(
    () =>
      supportsInvitationTranslations(sourceInvitation)
        ? localizeInvitation(sourceInvitation, locale)
        : sourceInvitation,
    [sourceInvitation, locale],
  );

  const handleLocaleChange = useCallback(
    (next: AppLocale) => {
      setLocale(next);
      // `replaceState` rather than `pushState`: Back should still leave the
      // invitation, as it does today, instead of stepping through languages.
      window.history.replaceState(
        null,
        "",
        buildInvitationLocaleReplaceUrl(
          pathname,
          searchParams?.toString() ?? "",
          next,
        ),
      );
      // The root layout set <html lang> server-side; without this it would keep
      // claiming the old locale to screen readers and translation tools.
      document.documentElement.lang = next;
    },
    [pathname, searchParams],
  );

  return (
    <NextIntlClientProvider locale={locale} messages={getClientMessages(locale)}>
      <InvitationLocaleChangeProvider
        mode="inline"
        onLocaleChange={handleLocaleChange}
      >
        <InvitationView
          invitation={invitation}
          theme={theme}
          isLandingPreview={isLandingPreview}
          lazyExternalIframe={lazyExternalIframe}
          initialSection={initialSection}
        />
      </InvitationLocaleChangeProvider>
    </NextIntlClientProvider>
  );
}
