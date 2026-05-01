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
/* ------------------------------------------------------------------ */

interface ExternalLinkPageProps {
  externalLink: string;
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
}: ExternalLinkPageProps) {
  const src = toProxiedUrl(externalLink);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <iframe
        src={src}
        title="Convite externo"
        allowFullScreen
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
