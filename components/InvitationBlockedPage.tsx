import { Ban } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/locales";

type Props = {
  /** Admin-entered reason (already trimmed); null hides the reason block. */
  reason: string | null;
  locale: AppLocale;
};

/**
 * Full-page notice rendered in place of any invitation surface (guest link,
 * RSVP, gifts, QR pass, owner page) once an admin has blocked the invitation.
 * Deliberately shows no invitation content — no names, theme, date or media.
 */
export default async function InvitationBlockedPage({
  reason,
  locale,
}: Props) {
  const t = await getTranslations({ locale, namespace: "InvitationBlocked" });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <Ban className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold text-stone-800">{t("title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          {t("description")}
        </p>
        {reason && (
          <div className="mt-6 rounded-lg bg-stone-100 px-4 py-3 text-left">
            <p className="text-[11px] font-medium uppercase tracking-widest text-stone-400">
              {t("reasonLabel")}
            </p>
            <p className="mt-1 text-sm whitespace-pre-line text-stone-700">
              {reason}
            </p>
          </div>
        )}
      </div>
      <p className="mt-8 text-xs text-stone-400">{t("footer")}</p>
    </main>
  );
}
