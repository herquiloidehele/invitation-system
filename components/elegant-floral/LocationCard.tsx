"use client";

import { motion } from "framer-motion";
import type { LocationInfo, TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { efStyle, resolveLocationPhotos } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";
import PhotoCarousel from "./PhotoCarousel";
import PillButton from "./PillButton";
import { efGroup, efItem, useRevealProps } from "./motion";

interface LocationCardProps {
  /** Section label, e.g. "Cerimónia Religiosa" / "Recepção". */
  label: string;
  location: LocationInfo;
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides | null;
  mapLabel?: string;
  routeLabel?: string;
}

function MapPin({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"
        stroke={color}
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.4" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

/** Venue card: pin + label, name, address, map/route pills, photo carousel. */
export default function LocationCard({
  label,
  location,
  theme,
  textStyles: ts,
  mapLabel = "Ver mapa",
  routeLabel = "Itinerário",
}: LocationCardProps) {
  const reveal = useRevealProps();
  const photos = resolveLocationPhotos(location);

  return (
    <motion.section
      style={{
        textAlign: "center",
        padding: "1.5rem clamp(1.5rem, 7vw, 3rem)",
        maxWidth: 520,
        margin: "0 auto",
      }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div
        variants={efItem}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <MapPin color={theme.secondary} />
        <span
          style={efStyle(
            {
              fontFamily: theme.scriptFont ?? theme.displayFont,
              fontSize: "clamp(1.4rem, 6vw, 1.9rem)",
              color: theme.primary,
              lineHeight: 1.1,
            },
            ts,
            "efSectionTitle",
          )}
        >
          <EditableText elementKey="efSectionTitle">{label}</EditableText>
        </span>
      </motion.div>

      <motion.h3
        variants={efItem}
        style={efStyle(
          {
            margin: "0.7rem 0 0.2rem",
            fontFamily: theme.displayFont,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontSize: "clamp(1rem, 4.2vw, 1.25rem)",
            color: theme.textPrimary,
          },
          ts,
          "efLocationName",
        )}
      >
        <EditableText elementKey="efLocationName">{location.name}</EditableText>
      </motion.h3>

      {location.address && (
        <motion.p
          variants={efItem}
          style={efStyle(
            {
              margin: 0,
              fontFamily: theme.bodyFont,
              color: theme.textSecondary,
              fontSize: "clamp(0.92rem, 3.6vw, 1.1rem)",
            },
            ts,
            "efLocationAddress",
          )}
        >
          <EditableText elementKey="efLocationAddress">
            {location.address}
          </EditableText>
        </motion.p>
      )}

      <motion.div
        variants={efItem}
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
          margin: "1.2rem 0 1.4rem",
        }}
      >
        {location.googleMapsUrl && (
          <PillButton href={location.googleMapsUrl} theme={theme} textStyles={ts}>
            {mapLabel}
          </PillButton>
        )}
        {location.wazeUrl && (
          <PillButton href={location.wazeUrl} theme={theme} textStyles={ts}>
            {routeLabel}
          </PillButton>
        )}
      </motion.div>

      {photos.length > 0 && (
        <motion.div variants={efItem}>
          <PhotoCarousel photos={photos} theme={theme} />
        </motion.div>
      )}
    </motion.section>
  );
}
