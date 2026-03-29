"use client";

import { motion } from "framer-motion";
import type { TemplateTheme } from "@/lib/types";

// ---------------------------------------------------------------------------
// Full-bleed section image with gradient fades blending into the theme bg
// ---------------------------------------------------------------------------

export default function SectionImage({
  src,
  theme,
  height = 300,
  hiddeBottom,
}: {
  src: string;
  theme: TemplateTheme;
  height?: number;
  hiddeBottom?: boolean;
}) {
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
      <img
        src={src}
        alt=""
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: 0.85,
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
