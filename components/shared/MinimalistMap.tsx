"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { TemplateTheme } from "@/lib/types";

// ---------------------------------------------------------------------------
// Tile layer URLs — free, no API key required
// ---------------------------------------------------------------------------

const TILES_LIGHT =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILES_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// ---------------------------------------------------------------------------
// Build an SVG marker that uses the theme primary color
// ---------------------------------------------------------------------------

function createPinIcon(accentColor: string): L.DivIcon {
  const svg = `
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 10.8 14.4 24.72 15.04 25.36a1.28 1.28 0 001.92 0C17.6 40.72 32 26.8 32 16 32 7.164 24.836 0 16 0z" fill="${accentColor}"/>
      <circle cx="16" cy="16" r="6" fill="white" fill-opacity="0.9"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "minimalist-map-pin",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

// ---------------------------------------------------------------------------
// Determine if a theme is "dark"
// ---------------------------------------------------------------------------

function isDarkTheme(theme: TemplateTheme): boolean {
  return theme.name === "midnight-elegance";
}

// ---------------------------------------------------------------------------
// CSS filter to make the map blend with the theme
// ---------------------------------------------------------------------------

function getMapFilter(theme: TemplateTheme): string {
  if (isDarkTheme(theme)) {
    // Dark theme: slightly brighten, desaturate a bit
    return "saturate(2.5) brightness(2.5) contrast(0.8)";
  }
  // Light themes: heavily desaturate for a clean, muted look
  return "saturate(0.15) brightness(1.05) contrast(0.95)";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MinimalistMapProps {
  latitude: number;
  longitude: number;
  theme: TemplateTheme;
  venueName?: string;
  className?: string;
}

export default function MinimalistMap({
  latitude,
  longitude,
  theme,
  venueName,
  className = "",
}: MinimalistMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 17,
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    const tileUrl = isDarkTheme(theme) ? TILES_DARK : TILES_LIGHT;

    L.tileLayer(tileUrl, {
      maxZoom: 80,
      subdomains: "abcd",
    }).addTo(map);

    // Custom pin marker using theme primary color
    const icon = createPinIcon(theme.secondary);
    const marker = L.marker([latitude, longitude], { icon, interactive: false }).addTo(map);

    // Popup with venue name
    if (venueName) {
      const popup = L.popup({
        closeButton: false,
        offset: [0, -30],
        className: "minimalist-map-popup",
        autoPan: false,
      })
        .setLatLng([latitude, longitude])
        .setContent(`<span style="font-weight:600;font-size:12px;white-space:nowrap;">${venueName}</span>`);
      popup.openOn(map);
      void marker; // suppress unused warning
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, theme.name, venueName]);

  return (
    <>
      {/* Hide leaflet's default icon styles and our custom pin container */}
      <style>{`
        .minimalist-map-pin {
          background: none !important;
          border: none !important;
        }
        .minimalist-map-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          padding: 0;
        }
        .minimalist-map-popup .leaflet-popup-content {
          margin: 6px 10px;
        }
        .minimalist-map-popup .leaflet-popup-tip-container {
          display: none;
        }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          font-size: 9px !important;
          opacity: 0.5;
        }
      `}</style>
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Map tiles */}
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "100%",
            filter: getMapFilter(theme),
            transition: "filter 0.5s ease",
          }}
        />
        {/* Primary-color tint overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: theme.secondary,
            opacity: isDarkTheme(theme) ? 0.25 : 0.35,
            mixBlendMode: "color",
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}
