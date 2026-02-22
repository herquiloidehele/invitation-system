"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Leaf } from "lucide-react";
import type { TemplateTheme } from "@/lib/types";

interface EnvelopeCoverProps {
  monogram: string;
  theme: TemplateTheme;
  onOpen: () => void;
}

export default function EnvelopeCover({
  monogram,
  theme,
  onOpen,
}: EnvelopeCoverProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden"
      style={{ backgroundColor: theme.envelope.base }}
      onClick={onOpen}
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "-100%" }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Envelope flaps */}
      {/* Top flap */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="0,0 100,0 50,50"
          fill={theme.envelope.topFlap}
          opacity={0.7}
        />
      </svg>

      {/* Bottom flap */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="0,100 100,100 50,50"
          fill={theme.envelope.bottomFlap}
          opacity={0.6}
        />
      </svg>

      {/* Left flap */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="0,0 50,50 0,100"
          fill={theme.envelope.leftFlap}
          opacity={0.5}
        />
      </svg>

      {/* Right flap */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="100,0 50,50 100,100"
          fill={theme.envelope.rightFlap}
          opacity={0.5}
        />
      </svg>

      {/* Center content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        {/* Monogram */}
        <span
          className="text-5xl leading-none sm:text-6xl"
          style={{
            fontFamily: theme.displayFont,
            color: theme.monogramColor,
          }}
        >
          {monogram}
        </span>

        {/* Wax seal */}
        <div
          className="flex h-[120px] w-[120px] items-center justify-center rounded-full shadow-xl"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #f5d675, #c9a230 50%, #a07d1c)",
          }}
        >
          <Leaf size={40} color="#fff" strokeWidth={1.5} />
        </div>

        {/* Tap text */}
        <motion.span
          className="text-xs uppercase tracking-[0.25em]"
          style={{ color: theme.tapTextColor }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Toque para Abrir
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

/**
 * Wrapper that manages open/close state with AnimatePresence.
 * Usage:
 *   <EnvelopeCoverAnimated isOpen={isOpen} ...props />
 */
export function EnvelopeCoverAnimated({
  isOpen,
  ...props
}: EnvelopeCoverProps & { isOpen: boolean }) {
  return (
    <AnimatePresence>
      {!isOpen && <EnvelopeCover key="envelope-cover" {...props} />}
    </AnimatePresence>
  );
}
