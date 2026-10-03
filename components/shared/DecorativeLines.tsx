"use client";

import { motion } from "framer-motion";

import type { TemplateTheme } from "@/lib/types";
import { EASE } from "./animations";

// ---------------------------------------------------------------------------
// Decorative section divider
// ---------------------------------------------------------------------------

/** Two gold lines around a pulsing dot. Hidden entirely when `show` is false. */
export function SectionDivider({
  theme,
  show = true,
}: {
  theme: TemplateTheme;
  show?: boolean;
}) {
  if (!show) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{
          width: 36,
          height: 1,
          background: theme.decorativeColor,
          transformOrigin: "right center",
        }}
      />
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
      >
        <motion.div
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: theme.accent,
          }}
        />
      </motion.div>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{
          width: 36,
          height: 1,
          background: theme.decorativeColor,
          transformOrigin: "left center",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section title underline
// ---------------------------------------------------------------------------

/**
 * Short accent line under a section title. Its margins also space the title
 * from the content, so when `show` is false an empty spacer of the same size
 * stays behind and the layout doesn't shift.
 */
export function SectionTitleUnderline({
  color,
  show = true,
  isPreview = false,
}: {
  color: string;
  show?: boolean;
  /** Animate immediately instead of on scroll (admin preview). */
  isPreview?: boolean;
}) {
  if (!show) {
    return <div aria-hidden className="mt-3 mb-6" style={{ height: 1 }} />;
  }

  return (
    <motion.div
      className="mt-3 mb-6"
      initial={{ scaleX: 0 }}
      {...(isPreview
        ? { animate: { scaleX: 1 } }
        : { whileInView: { scaleX: 1 }, viewport: { once: false } })}
      transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
      style={{
        width: 28,
        height: 1,
        background: color,
        opacity: 0.25,
        transformOrigin: "center",
      }}
    />
  );
}
