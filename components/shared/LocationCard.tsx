"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";

import type {
  CustomTexts,
  ImageSettingsKey,
  ImageSettingsMap,
  LocationInfo,
  TemplateTheme,
} from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { getImageStyle } from "@/lib/image-settings";
import { EditableText } from "./EditableText";
import { t } from "@/lib/custom-texts";

// Dynamically import the map with ssr: false to prevent Leaflet from being
// evaluated on the server (Leaflet requires `window`, which doesn't exist in SSR)
const MinimalistMap = dynamic(() => import("./MinimalistMap"), { ssr: false });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Detect whether the user is on an Apple platform (iOS / macOS)
 * and return the appropriate external map URL.
 */
function getExternalMapUrl(location: LocationInfo): string {
  if (typeof navigator === "undefined") return location.googleMapsUrl;

  const ua = navigator.userAgent || "";
  const isApple =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    /Macintosh/.test(ua);

  if (isApple) {
    if (location.latitude != null && location.longitude != null) {
      return `https://maps.apple.com/?ll=${location.latitude},${location.longitude}&q=${encodeURIComponent(location.name)}`;
    }
    return `https://maps.apple.com/?q=${encodeURIComponent(location.name + ", " + location.address)}`;
  }

  return location.googleMapsUrl;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface LocationCardProps {
  location: LocationInfo;
  theme: TemplateTheme;
  /** Resolved text styles — when provided, text elements use these instead of raw theme values */
  ts?: ResolvedTextStyles;
  /** Per-section card background override. Falls back to theme.cardBg. */
  cardBg?: string;
  /** Per-section card border override. Falls back to theme.cardBorder. */
  cardBorder?: string;
  /** Per-section card border-radius override. Falls back to 16. */
  cardBorderRadius?: number;
  onMapsClick?: () => void;
  /** Per-image position & zoom overrides map. */
  imageSettings?: ImageSettingsMap;
  /** Which image key to use for this location. */
  imageKey?: ImageSettingsKey;
  /** Per-invitation UI text overrides. */
  customTexts?: CustomTexts;
}

export default function LocationCard({
  location,
  theme,
  ts,
  cardBg,
  cardBorder,
  cardBorderRadius,
  onMapsClick,
  imageSettings,
  imageKey,
  customTexts: ct,
}: LocationCardProps) {
  const effectiveCardBg = cardBg || theme.cardBg;
  const effectiveCardBorder = cardBorder || theme.cardBorder;
  const hasCoordinates =
    location.latitude != null && location.longitude != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: EASE }}
      className="flex flex-col overflow-hidden pt-5"
      style={{
        background: effectiveCardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: cardBorderRadius ?? 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
        border: `1px solid ${effectiveCardBorder}`,
      }}
    >
      {/* Venue image — shown only if imageUrl is provided */}
      {location.imageUrl && (
        <div
          className="relative w-full overflow-hidden"
          style={{ height: 180 }}
        >
          <Image
            src={location.imageUrl}
            alt={location.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
            style={
              imageKey ? getImageStyle(imageSettings, imageKey) : undefined
            }
          />
        </div>
      )}

      {/* Venue name + address */}
      <div className="flex flex-col gap-1 px-5 pb-3">
        <EditableText elementKey="locationName">
          <span
            style={{
              fontFamily: ts?.bodyFont ?? theme.bodyFont,
              fontSize: 16,
              fontWeight: 600,
              color: ts?.textPrimary ?? theme.textPrimary,
              ...(ts?.locationName ?? {}),
            }}
          >
            {location.name}
          </span>
        </EditableText>
        <EditableText elementKey="locationAddress">
          <span
            style={{
              fontFamily: ts?.uiFont ?? theme.uiFont,
              fontSize: 14,
              fontWeight: 400,
              color: ts?.textSecondary ?? theme.textSecondary,
              lineHeight: 1.5,
              ...(ts?.locationAddress ?? {}),
            }}
          >
            {location.address}
          </span>
        </EditableText>
      </div>

      {/* Map preview */}
      {hasCoordinates && (
        <div className="px-5 pb-4">
          <div
            className="relative w-full overflow-hidden"
            style={{
              height: 180,
              borderRadius: 12,
              border: `1px solid ${effectiveCardBorder}`,
            }}
          >
            <ErrorBoundary
              fallback={
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-2"
                  style={{ background: effectiveCardBg }}
                >
                  <MapPin size={24} color={theme.textMuted} strokeWidth={1.5} />
                  <span
                    style={{
                      fontFamily: ts?.uiFont ?? theme.uiFont,
                      fontSize: 12,
                      color: ts?.textMuted ?? theme.textMuted,
                    }}
                  >
                    {t(ct, "map_unavailableOffline")}
                  </span>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: effectiveCardBg }}
                  >
                    <MapPin
                      size={24}
                      color={theme.textMuted}
                      strokeWidth={1.5}
                    />
                  </div>
                }
              >
                <MinimalistMap
                  latitude={location.latitude!}
                  longitude={location.longitude!}
                  theme={theme}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      )}

      {/* Open in external maps button */}
      <div className="px-5 pb-5">
        <motion.a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onMapsClick?.();
            window.open(
              getExternalMapUrl(location),
              "_blank",
              "noopener,noreferrer",
            );
          }}
          className="flex w-full items-center justify-center gap-2 px-4 py-3 transition-all"
          style={{
            fontFamily: ts?.uiFont ?? theme.uiFont,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 0.8,
            background: "transparent",
            border: `1.5px solid ${theme.ctaSecondaryBorder}`,
            color: theme.ctaSecondaryText,
            borderRadius: theme.ctaRadius,
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <ExternalLink size={15} strokeWidth={1.5} />
          {t(ct, "cta_openMap")}
        </motion.a>
      </div>
    </motion.div>
  );
}
