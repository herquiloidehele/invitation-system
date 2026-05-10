"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TemplateTheme } from "@/lib/types";
import { measureIframeBodyHeight } from "@/lib/canva-embed-measurement";
import { getExternalInvitationEmbedSrc } from "@/lib/external-invitation-form";

/**
 * Appends the proxy's no-scroll opt-in flag to a same-origin URL string.
 * Preserves any existing query parameters the upstream Canva URL carried.
 */
function appendDisableScrollFlag(src: string): string {
  if (!src) return src;
  return src + (src.includes("?") ? "&" : "?") + "disableScroll=1";
}

interface CanvaEmbedProps {
  externalLink: string;
  theme: TemplateTheme;
  /** Defaults to 9/16 (portrait — typical Canva wedding format). */
  aspectRatio?: number;
  /** iframe accessibility title. Defaults to "Convite". */
  title?: string;
  /**
   * When true, the iframe mounts and starts fetching but is positioned
   * off-screen (fixed, far below the viewport) so it never participates
   * in document layout. This lets the Canva page download AND finish
   * measuring while the curtain hero is still on screen — by the time
   * the user reveals the page, the height is already known and Safari
   * has nothing to scroll-anchor against. Once `preloading` flips to
   * false the same iframe slots into normal flow with no extra fetch.
   */
  preloading?: boolean;
}

export default function CanvaEmbed({
  externalLink,
  theme,
  aspectRatio,
  title,
  preloading = false,
}: CanvaEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const measureTimerRef = useRef<number[]>([]);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  // We size the iframe element to the proxied document's full content
  // height, so the embedded page must not scroll independently. The
  // proxy honours `?disableScroll=1` to inject the no-scroll style block;
  // ExternalLinkPage omits the flag and gets the Canva page rendered as-is.
  const proxiedUrl = externalLink
    ? appendDisableScrollFlag(getExternalInvitationEmbedSrc(externalLink))
    : "";
  const ar = aspectRatio ?? 9 / 16;

  const measureIframe = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    const body = doc?.body;
    if (!body) return;

    // We deliberately ignore `documentElement.scrollHeight` here: during
    // off-screen preload the iframe is forced to a large fixed height by
    // its wrapper, which makes the iframe's <html> report that wrapper
    // size as its viewport. The <body> is the only honest signal for the
    // proxied Canva content's true height.
    const nextHeight = measureIframeBodyHeight({
      bodyScrollHeight: body.scrollHeight,
      bodyOffsetHeight: body.offsetHeight,
    });

    if (nextHeight !== null) {
      setContentHeight(nextHeight);
    }
  }, []);

  useEffect(() => {
    const onResize = () => measureIframe();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      measureTimerRef.current.forEach((timer) => window.clearTimeout(timer));
      measureTimerRef.current = [];
    };
  }, [measureIframe]);

  const handleLoad = useCallback(() => {
    measureIframe();
    measureTimerRef.current.forEach((timer) => window.clearTimeout(timer));
    measureTimerRef.current = [100, 500, 1000, 2500].map((delay) =>
      window.setTimeout(measureIframe, delay),
    );

    // Subscribe to size changes inside the iframe document so dynamic Canva
    // content (lazy-loaded sections, fonts, images) keeps the host iframe
    // height in sync. Same-origin via the proxy makes this access legal.
    const doc = iframeRef.current?.contentDocument;
    const target = doc?.documentElement;
    if (!doc || !target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measureIframe());
    observer.observe(target);
    if (doc.body) observer.observe(doc.body);
    measureTimerRef.current.push(
      window.setTimeout(() => observer.disconnect(), 60_000),
    );
  }, [measureIframe]);

  if (!externalLink) return null;

  // The section reserves layout space. When preloading, height collapses to
  // 0 so it occupies no flow; when revealed, we use the measured height
  // (or aspect-ratio fallback) so the page lays out correctly. Crucially,
  // the iframe element itself is NEVER remounted — only its wrapper's
  // positioning flips between fixed-offscreen and absolute-fill — so the
  // browser keeps the same loaded document across the transition.
  const sectionStyle = preloading
    ? {
        width: "100%",
        height: 0,
        overflow: "hidden" as const,
        background: theme.bg,
        overflowAnchor: "none" as const,
      }
    : {
        // If preloading already ran we have a measured height — apply it
        // immediately so there is no aspect-ratio placeholder → measured
        // height jump on Safari.
        height: contentHeight ? `${contentHeight}px` : undefined,
        aspectRatio: contentHeight ? undefined : ar,
        background: theme.bg,
        // Critical: disable browser scroll anchoring on this section.
        // When the iframe finishes loading on a slow connection, its
        // measured height jumps from the aspect-ratio placeholder to
        // several thousand pixels. By default Chrome/Safari then scroll
        // the viewport down to keep an "anchor" element in place — which
        // in our layout means yanking the user mid-page just as they
        // started reading. Disabling overflow-anchor here keeps their
        // scroll position fixed while the section grows beneath them.
        overflowAnchor: "none" as const,
      };

  // While preloading the iframe lives in a fixed, far-off-screen wrapper
  // so the browser fetches AND lays it out (giving us a measured height)
  // without ever affecting document flow. When revealed, the same wrapper
  // becomes an absolute fill of the section, no remount, no refetch.
  const wrapperStyle: React.CSSProperties = preloading
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        // Leave the wrapper tall enough that the iframe can render its full
        // content during preload. The exact value doesn't matter as long as
        // it's larger than the eventual measured height — Canva embeds top
        // out around 8000–10000 px in practice.
        height: 12000,
        transform: "translateY(200vh)",
        pointerEvents: "none",
        opacity: 0,
        zIndex: -1,
        overflow: "hidden",
        contain: "strict",
        // The CanvaEmbed lives inside a `visibility: hidden` reveal wrapper
        // pre-reveal. Iframes inside a hidden subtree are painted at zero
        // size on Safari, which would defeat the whole point of the preload.
        // Force the off-screen wrapper visible so the iframe document
        // actually fetches and lays out.
        visibility: "visible",
      }
    : {
        position: "absolute",
        inset: 0,
      };

  return (
    <section
      id="details"
      className={preloading ? undefined : "relative w-full"}
      aria-hidden={preloading || undefined}
      style={sectionStyle}
    >
      <div style={wrapperStyle} aria-hidden={preloading}>
        <iframe
          ref={iframeRef}
          src={proxiedUrl}
          title={title ?? "Convite"}
          loading="eager"
          onLoad={handleLoad}
          allow="autoplay; fullscreen; clipboard-write"
          referrerPolicy="no-referrer"
          scrolling="no"
          style={{
            border: "none",
            display: "block",
            width: "100%",
            height: preloading
              ? contentHeight
                ? `${contentHeight}px`
                : "100%"
              : "100%",
          }}
        />
      </div>
    </section>
  );
}
