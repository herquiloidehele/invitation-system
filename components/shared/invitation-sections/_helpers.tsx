"use client";

import { motion, type Variants } from "framer-motion";
import { EASE } from "@/components/shared/animations";

// ---------------------------------------------------------------------------
// Shared animation variants used by the optional InvitationPage sections.
// Kept in a tiny helper module so each extracted section can import them
// without pulling InvitationPage back into the dynamic chunk.
// ---------------------------------------------------------------------------

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

// ---------------------------------------------------------------------------
// AnimatedSection wrapper — same behaviour as the one previously inlined
// in InvitationPage.tsx. Default entrance is `fadeInUp`.
// ---------------------------------------------------------------------------

export function AnimatedSection({
  children,
  className = "",
  variants: customVariants,
  isPreview = false,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  isPreview?: boolean;
}) {
  return (
    <motion.section
      variants={customVariants ?? fadeInUp}
      initial="hidden"
      {...(isPreview
        ? { animate: "visible" }
        : {
            whileInView: "visible",
            viewport: { once: false, margin: "-60px" },
          })}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Shared card-style shape returned by `InvitationPage.cs(section, radius)`.
// Each extracted section accepts this so the resolution logic stays in
// the parent.
// ---------------------------------------------------------------------------

export interface ResolvedCardStyle {
  cardBg: string;
  cardBorder: string;
  borderRadius: number;
  accentColor?: string;
}
