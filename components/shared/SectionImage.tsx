"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type {
  ImageSettingsKey,
  ImageSettingsMap,
  TemplateTheme,
} from "@/lib/types";
import { getImageStyle } from "@/lib/image-settings";

// ---------------------------------------------------------------------------
// Full-bleed section image with gradient fades blending into the theme bg
// ---------------------------------------------------------------------------

export default function SectionImage({
  src,
  theme,
  height = 300,
  hiddeBottom,
  imageSettings,
  imageKey,
}: {
  src: string;
  theme: TemplateTheme;
  height?: number;
  hiddeBottom?: boolean;
  imageSettings?: ImageSettingsMap;
  imageKey?: ImageSettingsKey;
}) {
  const imgStyle = imageKey ? getImageStyle(imageSettings, imageKey) : {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      style={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
      }}
    >
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        // Invitation column is capped at 500 px; `sizes` lets Next.js pick
        // the right responsive variant without overfetching on mobile.
        sizes="(max-width: 500px) 100vw, 500px"
        style={{
          objectFit: "cover",
          opacity: 0.85,
          ...imgStyle,
        }}
      />
      {/* Top gradient — strong fade into bg */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, ${theme.bg} 0%, ${theme.bg}F2 5%, ${theme.bg}CC 12%, ${theme.bg}99 22%, ${theme.bg}4D 35%, ${theme.bg}1A 50%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      {/* Bottom gradient — strong fade into bg */}
      {!hiddeBottom && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${theme.bg} 0%, ${theme.bg}F2 5%, ${theme.bg}CC 12%, ${theme.bg}99 22%, ${theme.bg}4D 35%, ${theme.bg}1A 50%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Left edge gradient */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to right, ${theme.bg} 0%, ${theme.bg}99 3%, ${theme.bg}4D 8%, ${theme.bg}1A 14%, transparent 22%)`,
          pointerEvents: "none",
        }}
      />
      {/* Right edge gradient */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to left, ${theme.bg} 0%, ${theme.bg}99 3%, ${theme.bg}4D 8%, ${theme.bg}1A 14%, transparent 22%)`,
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}
