"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { getMotionProps, landingContainerVariants } from "./landing-motion";

export function AnimatedSection({
  children,
  className,
  id,
  variants = landingContainerVariants,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  variants?: Variants;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      {...getMotionProps(reduceMotion, variants)}
      className={className}
    >
      {children}
    </motion.section>
  );
}
