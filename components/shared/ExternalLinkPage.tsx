"use client";

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
/*  When `visible` is false the iframe is mounted but visually hidden  */
/*  so the upstream content can pre-load behind the envelope cover —   */
/*  the same prefetch pattern used by ExternalVideoPage.                */
/* ------------------------------------------------------------------ */

interface ExternalLinkPageProps {
  externalLink: string;
  visible?: boolean;
}

/**
 * Convert an absolute external URL into a same-origin proxied URL so it
 * can be embedded in an iframe even when the target sets a restrictive
 * `frame-ancestors` CSP (e.g. Canva).
 *
 * Falls back to the original URL when parsing fails.
 */
function toProxiedUrl(externalLink: string): string {
  try {
    const u = new URL(externalLink);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return externalLink;
    }
    const path = u.pathname === "/" ? "" : u.pathname;
    return `/canva-proxy/${u.host}${path}${u.search}`;
  } catch {
    return externalLink;
  }
}

export default function ExternalLinkPage({
  externalLink,
  visible = true,
}: ExternalLinkPageProps) {
  const src = toProxiedUrl(externalLink);

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: visible ? 50 : 0,
        overflow: "hidden",
        // Keep the iframe in the layout so it loads, but invisible and
        // unclickable until revealed. Avoid `display: none` because that
        // would defer or restart the load in some browsers.
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <iframe
        src={src}
        title="Convite externo"
        allowFullScreen
        // `eager` is the default but we set it explicitly to make the prefetch
        // intent obvious — the iframe must load even when not yet visible.
        loading="eager"
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
