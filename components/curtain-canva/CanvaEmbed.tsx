"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TemplateTheme } from "@/lib/types";
import { getExternalInvitationEmbedSrc } from "@/lib/external-invitation-form";

interface CanvaEmbedProps {
  externalLink: string;
  theme: TemplateTheme;
  /** Defaults to 9/16 (portrait — typical Canva wedding format). */
  aspectRatio?: number;
  /** iframe accessibility title. Defaults to "Convite". */
  title?: string;
}

export default function CanvaEmbed({
  externalLink,
  theme,
  aspectRatio,
  title,
}: CanvaEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const measureTimerRef = useRef<number[]>([]);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const proxiedUrl = externalLink
    ? getExternalInvitationEmbedSrc(externalLink)
    : "";
  const ar = aspectRatio ?? 9 / 16;

  const measureIframe = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const nextHeight = Math.max(
      doc.documentElement.scrollHeight,
      doc.body?.scrollHeight ?? 0,
      doc.documentElement.offsetHeight,
      doc.body?.offsetHeight ?? 0,
    );

    if (nextHeight > 0) {
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

  return (
    <section
      id="details"
      className="relative w-full"
      style={{
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
        overflowAnchor: "none",
      }}
    >
      <iframe
        ref={iframeRef}
        src={proxiedUrl}
        title={title ?? "Convite"}
        loading="lazy"
        onLoad={handleLoad}
        allow="autoplay; fullscreen; clipboard-write"
        referrerPolicy="no-referrer"
        scrolling="no"
        className="block w-full h-full"
        style={{ border: "none", display: "block" }}
      />
    </section>
  );
}
