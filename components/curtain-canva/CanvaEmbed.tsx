"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TemplateTheme } from "@/lib/types";
import { measureIframeBodyHeight } from "@/lib/canva-embed-measurement";
import {
  appendCanvaProxyDisableScrollFlag,
  getExternalInvitationEmbedSrc,
  isInitialCanvaEmbedPage,
  resolveCanvaEmbedPageState,
} from "@/lib/external-invitation-form";

interface CanvaEmbedProps {
  externalLink: string;
  theme: TemplateTheme;
  /** Defaults to 9/16 (portrait — typical Canva wedding format). */
  aspectRatio?: number;
  /** iframe accessibility title. Defaults to "Convite". */
  title?: string;
  onInitialPageChange?: (isInitialPage: boolean) => void;
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
  onInitialPageChange,
  preloading = false,
}: CanvaEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const measureTimerRef = useRef<number[]>([]);
  // ResizeObserver instance created in handleLoad and disconnected
  // on unmount. Stored at the component level (not inside the load
  // callback) so the outer effect cleanup can disconnect it even if
  // the component unmounts before the 60-second safety timer fires.
  const observerRef = useRef<ResizeObserver | null>(null);
  const detachNavigationInterceptorRef = useRef<(() => void) | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [navigatedProxiedUrl, setNavigatedProxiedUrl] = useState<{
    externalLink: string;
    src: string;
  } | null>(null);
  // We size the iframe element to the proxied document's full content
  // height, so the embedded page must not scroll independently. The
  // proxy honours `?disableScroll=1` to inject the no-scroll style block;
  // ExternalLinkPage omits the flag and gets the Canva page rendered as-is.
  const ar = aspectRatio ?? 9 / 16;
  const defaultProxiedUrl = externalLink
    ? appendCanvaProxyDisableScrollFlag(
        getExternalInvitationEmbedSrc(externalLink),
      )
    : "";
  const proxiedUrl =
    navigatedProxiedUrl?.externalLink === externalLink
      ? navigatedProxiedUrl.src
      : defaultProxiedUrl;

  const syncPageStateFromIframe = useCallback(() => {
    let actualSrc = proxiedUrl;

    try {
      actualSrc = iframeRef.current?.contentDocument?.location.href ?? actualSrc;
    } catch {
      /* Cross-origin iframes are not expected here, but keep the fallback. */
    }

    const pageState = resolveCanvaEmbedPageState({
      actualSrc,
      currentNavigatedProxiedUrl: navigatedProxiedUrl,
      externalLink,
      initialSrc: defaultProxiedUrl,
    });

    setNavigatedProxiedUrl(pageState.navigatedProxiedUrl);
    onInitialPageChange?.(pageState.isInitialPage);
  }, [
    defaultProxiedUrl,
    externalLink,
    navigatedProxiedUrl,
    onInitialPageChange,
    proxiedUrl,
  ]);

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
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (detachNavigationInterceptorRef.current) {
        detachNavigationInterceptorRef.current();
        detachNavigationInterceptorRef.current = null;
      }
    };
  }, [measureIframe]);

  const attachNavigationInterceptor = useCallback(() => {
    if (detachNavigationInterceptorRef.current) {
      detachNavigationInterceptorRef.current();
      detachNavigationInterceptorRef.current = null;
    }

    let doc: Document | null | undefined;
    try {
      doc = iframeRef.current?.contentDocument;
    } catch {
      return;
    }
    if (!doc) return;

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const target = anchor.getAttribute("target")?.toLowerCase();
      if (target && target !== "_self") return;

      let nextUrl: URL;
      try {
        nextUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (
        nextUrl.origin !== window.location.origin ||
        !nextUrl.pathname.startsWith("/canva-proxy/")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const nextSrc = appendCanvaProxyDisableScrollFlag(
        `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
      );
      const isInitialPage = isInitialCanvaEmbedPage(nextSrc, defaultProxiedUrl);

      setContentHeight(null);
      setNavigatedProxiedUrl(
        isInitialPage ? null : { externalLink, src: nextSrc },
      );
      onInitialPageChange?.(isInitialPage);
    };

    doc.addEventListener("click", onClick, true);
    detachNavigationInterceptorRef.current = () => {
      doc.removeEventListener("click", onClick, true);
    };
  }, [defaultProxiedUrl, externalLink, onInitialPageChange]);

  const handleLoad = useCallback(() => {
    attachNavigationInterceptor();
    syncPageStateFromIframe();
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

    // Disconnect any prior observer (e.g. if iframe `src` changed and
    // onLoad fires a second time) before we replace the ref.
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    const observer = new ResizeObserver(() => measureIframe());
    observer.observe(target);
    if (doc.body) observer.observe(doc.body);
    observerRef.current = observer;

    // Safety net: stop observing after 60 s even if the component stays
    // mounted; by then the iframe document should be fully laid out and
    // further observations are just noise. The unmount cleanup above
    // also covers the early-unmount case.
    measureTimerRef.current.push(
      window.setTimeout(() => {
        if (observerRef.current === observer) {
          observer.disconnect();
          observerRef.current = null;
        }
      }, 60_000),
    );
  }, [attachNavigationInterceptor, measureIframe, syncPageStateFromIframe]);

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
            width: "calc(100% + 16px)",
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
