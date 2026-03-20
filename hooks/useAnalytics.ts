"use client";

import { useCallback, useEffect, useRef } from "react";

export type AnalyticsEventType =
  | "page_view"
  | "envelope_open"
  | "maps_click"
  | "waze_click"
  | "gift_click"
  | "audio_play"
  | "calendar_click"
  | "rsvp_submit";

function getOrCreate(
  storage: Storage,
  key: string,
  factory: () => string,
): string {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const value = factory();
    storage.setItem(key, value);
    return value;
  } catch {
    return factory();
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/**
 * Lightweight analytics hook.
 * - visitorId: persistent across sessions (localStorage)
 * - sessionId: per-tab session (sessionStorage)
 * - trackEvent: fire-and-forget POST to /api/events
 */
export function useAnalytics(slug: string) {
  const visitorIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    visitorIdRef.current = getOrCreate(
      localStorage,
      "analytics_vid",
      generateId,
    );
    sessionIdRef.current = getOrCreate(
      sessionStorage,
      "analytics_sid",
      generateId,
    );
  }, []);

  const trackEvent = useCallback(
    (type: AnalyticsEventType) => {
      // Best-effort — never blocks the UI
      try {
        const body = JSON.stringify({
          slug,
          type,
          visitorId: visitorIdRef.current || generateId(),
          sessionId: sessionIdRef.current || generateId(),
          device: detectDevice(),
          referrer:
            typeof document !== "undefined"
              ? document.referrer.slice(0, 200)
              : "",
        });
        // Use sendBeacon when available (survives page unload), fallback to fetch
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(
            "/api/events",
            new Blob([body], { type: "application/json" }),
          );
        } else {
          fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* silent */
      }
    },
    [slug],
  );

  return { trackEvent };
}
