"use client";

import { getExternalInvitationEmbedSrc } from "@/lib/external-invitation-form";

/* ------------------------------------------------------------------ */
/*  ExternalLinkPage                                                    */
/*                                                                      */
/*  Full-screen iframe rendering the external invitation URL.          */
/*  Completely immersive — no header, no footer, no chrome.            */
/*                                                                      */
/*  Canva-published sites set a strict CSP `frame-ancestors` header    */
/*  that blocks third-party iframes. To work around this, the URL is   */
/*  rewritten to go through `/canva-proxy/<host>/<path>`, a Next.js    */
/*  route that strips framing-blocking response headers.                */
/*                                                                      */
/*  Load timing strategy:                                               */
/*                                                                      */
/*    The iframe ALWAYS mounts — even before `visible=true`. While     */
/*    hidden, it lives off-screen behind the envelope cover, so the    */
/*    upstream Canva document and its subresources are downloaded in   */
/*    parallel with the envelope animation (~1.2 s) instead of after   */
/*    it. When the envelope finishes opening, the same iframe element  */
/*    is repositioned to fill the viewport — no remount, no second     */
/*    proxy fetch (the new edge-cache SWR window in /canva-proxy keeps */
/*    even repeated fetches near-instant).                              */
/* ------------------------------------------------------------------ */

interface ExternalLinkPageProps {
  externalLink: string;
  visible?: boolean;
}

/**
 * Kept for backward compatibility with callers that ask whether the
 * iframe DOM is currently mounted. With the preload-then-reveal
 * strategy the iframe is now always mounted (so subresources start
 * downloading behind the envelope cover), regardless of the visibility
 * flag — hence the unconditional `true`
 */
export function shouldMountExternalInvitationIframe(): boolean {
  return true;
}

export default function ExternalLinkPage({
  externalLink,
  visible = true,
}: ExternalLinkPageProps) {
  const src = getExternalInvitationEmbedSrc(externalLink);

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        // Stay below the envelope cover (which lives at z-index 100) while
        // hidden, then float above page content once revealed.
        zIndex: visible ? 50 : 0,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        // `visibility: visible` while preloading is intentional: it keeps
        // the iframe element painted on a real layout layer so its
        // document parses, executes JS and downloads subresources.
        // `opacity: 0` plus `pointerEvents: none` is what hides it from
        // the user. The envelope cover (z-index 100) fully occludes it
        // anyway, so there is nothing visible to flash.
        visibility: "visible",
      }}
    >
      <iframe
        src={src}
        title="Convite externo"
        allowFullScreen
        loading="eager"
        style={{
          position: "absolute",
          inset: 0,
          width: "calc(100% + 16px)",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
    </div>
  );
}
