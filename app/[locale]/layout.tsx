import type { ReactNode } from "react";
import { headers } from "next/headers";
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

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Skip GA when this document is being loaded inside an <iframe>. The landing
  // page showcases invitations by embedding the real invitation route in
  // phone-preview iframes (see components/landing/PhoneIframePreview.tsx), and
  // those preview loads must not inflate analytics. The browser reports the
  // request destination: top-level visits send `Sec-Fetch-Dest: document`,
  // while iframe embeds send `iframe` (or `frame`). When the header is absent
  // (ancient browsers / privacy tools), we fail open and track.
  const fetchDest = (await headers()).get("sec-fetch-dest");
  const isEmbeddedPreview = fetchDest === "iframe" || fetchDest === "frame";

  return (
    <>
      {children}
      {gaId && !isEmbeddedPreview && <GoogleAnalytics gaId={gaId} />}
    </>
  );
}
