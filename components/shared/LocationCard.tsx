"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin, ExternalLink } from "lucide-react";
import Image from "next/image";

import type { LocationInfo, TemplateTheme } from "@/lib/types";

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

interface LocationCardProps {
  location: LocationInfo;
  theme: TemplateTheme;
  onMapsClick?: () => void;
}

export default function LocationCard({ location, theme, onMapsClick }: LocationCardProps) {
  const hasCoordinates =
    location.latitude != null && location.longitude != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: EASE }}
      className="flex flex-col overflow-hidden"
      style={{
        background: theme.cardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 16,
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      {/* Header — icon + title */}
      <div
        className="flex items-center gap-3 px-5 pt-5 pb-4"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${theme.accent}12` }}
        >
          <MapPin size={20} color={theme.accent} strokeWidth={1.5} />
        </div>
        <span
          style={{
            fontFamily: theme.uiFont,
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            color: theme.textMuted,
          }}
        >
          Localização
        </span>
      </div>

      {/* Venue image — shown only if imageUrl is provided */}
      {location.imageUrl && (
        <div className="relative w-full" style={{ height: 180 }}>
          <Image
            src={location.imageUrl}
            alt={location.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
          />
        </div>
      )}

      {/* Venue name + address */}
      <div className="flex flex-col gap-1 px-5 pb-3">
        <span
          style={{
            fontFamily: theme.bodyFont,
            fontSize: 16,
            fontWeight: 600,
            color: theme.textPrimary,
          }}
        >
          {location.name}
        </span>
        <span
          style={{
            fontFamily: theme.uiFont,
            fontSize: 14,
            fontWeight: 400,
            color: theme.textSecondary,
            lineHeight: 1.5,
          }}
        >
          {location.address}
        </span>
      </div>

      {/* Map preview */}
      {hasCoordinates && (
        <div className="px-5 pb-4">
          <div
            className="relative w-full overflow-hidden"
            style={{
              height: 180,
              borderRadius: 12,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <Suspense
              fallback={
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: theme.cardBg }}
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
            window.open(getExternalMapUrl(location), "_blank", "noopener,noreferrer");
          }}
          className="flex w-full items-center justify-center gap-2 px-4 py-3 transition-all"
          style={{
            fontFamily: theme.uiFont,
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
          Abrir no Mapa
        </motion.a>
      </div>
    </motion.div>
  );
}
