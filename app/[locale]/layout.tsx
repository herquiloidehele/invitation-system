import type { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

// Google Analytics 4 is loaded here — at the `[locale]` segment boundary —
// so it covers every public page (landing, invitation viewer, RSVP,
// confirmations) while excluding `/admin` and `/login`, which live outside
// this segment. The gtag scripts load via next/script's `afterInteractive`
// strategy (handled inside <GoogleAnalytics>), so they never block render.
//
// Gated on NEXT_PUBLIC_GA_ID: the variable is set only in the Railway
// (production) environment, so local dev and any env without it render no
// analytics and send no traffic to the GA property.
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </>
  );
}
