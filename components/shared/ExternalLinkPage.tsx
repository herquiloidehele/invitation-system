"use client";

import { useEffect, useRef, useState } from "react";

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
/*    1. The iframe mounts immediately, even while `visible` is false. */
/*       This pre-warms the HTTP cache: HTML, JS, CSS, fonts and       */
/*       images all download in the background while the envelope      */
/*       cover is still on top.                                         */
/*                                                                      */
/*    2. When `visible` flips to true (envelope animation complete)    */
/*       we force a fresh load of the iframe by bumping its `key`.     */
/*       This restarts Canva's intro animations from frame 0, but the */
/*       second load is near-instant because every asset is cached.    */
/*                                                                      */
/*  Without step 2 the user would see the invitation mid-animation —   */
/*  Canva's scripts kick off the moment the document parses, which is */
/*  long before the envelope opens.                                     */
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

  // The key bump triggers a fresh iframe load when we transition from
  // hidden → visible, restarting upstream animations from the start.
  const [loadKey, setLoadKey] = useState(0);
  const hasRevealedRef = useRef(false);

  useEffect(() => {
    if (visible && !hasRevealedRef.current) {
      hasRevealedRef.current = true;
      setLoadKey((k) => k + 1);
    }
  }, [visible]);

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
        key={loadKey}
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
