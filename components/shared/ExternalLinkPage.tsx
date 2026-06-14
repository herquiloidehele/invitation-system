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
/*    The iframe always mounts (single load — no remount on reveal).   */
/*    While the envelope is closed it lives at `transform:             */
/*    translateY(200vh)`, i.e. one viewport-height below where the     */
/*    user is looking. The iframe document keeps its natural 100vw ×   */
/*    100vh box, so HTML + subresources download and render normally  */
/*    in parallel with the envelope animation — the user just doesn't  */
/*    see any of it. When the envelope finishes opening, the wrapper   */
/*    snaps back to `inset: 0` and the iframe slides into view; if    */
/*    Canva's entrance animations are driven by elements crossing the */
/*    iframe's viewport, this reposition is where they fire.           */
/*                                                                      */
/*    Caveat: standard IntersectionObserver (v1) inside the iframe is */
/*    scoped to the iframe document's own viewport, which doesn't      */
/*    change when we move the iframe element around in the parent.    */
/*    If Canva fires its entrance animations on initial paint (before */
/*    the reposition) instead of on viewport-cross, the off-viewport  */
/*    positioning won't defer them and the user will still see the    */
/*    static end state. Verify in the browser; if so, fall back to    */
/*    a remount-on-reveal pattern (changing the iframe `key`).         */
/* ------------------------------------------------------------------ */

interface ExternalLinkPageProps {
  externalLink: string;
  visible?: boolean;
  lazyLoadIframe?: boolean;
}

export default function ExternalLinkPage({
  externalLink,
  visible = true,
  lazyLoadIframe = false,
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
        // While hidden, sit behind the envelope; while visible, float on
        // top of the rest of the page.
        zIndex: visible ? 50 : -1,
        overflow: "hidden",
        // Move the wrapper one viewport down while hidden. The iframe
        // element still has its full 100vw × 100vh layout box, so the
        // iframe document loads and renders as if it were on-screen —
        // the only thing changing is where the wrapper paints in the
        // parent. When revealed, we snap back to inset: 0 in a single
        // step, no transition (we don't want to compete with Canva's
        // own entrance animations).
        transform: visible ? "none" : "translateY(200vh)",
        pointerEvents: visible ? "auto" : "none",
        visibility: "visible",
      }}
    >
      <iframe
        src={src}
        title="Convite externo"
        allowFullScreen
        loading={lazyLoadIframe ? "lazy" : "eager"}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
    </div>
  );
}
