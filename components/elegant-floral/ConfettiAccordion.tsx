"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ChevronDown } from "lucide-react";
import type { TemplateTheme } from "@/lib/types";
import { EASE } from "@/components/shared/animations";

/** Fire a small confetti burst centered on the just-opened header. */
function burstAt(el: HTMLElement, colors: string[]) {
  const rect = el.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  confetti({
    particleCount: 38,
    spread: 65,
    startVelocity: 26,
    gravity: 0.85,
    decay: 0.92,
    scalar: 0.85,
    ticks: 110,
    colors,
    origin: { x, y },
    disableForReducedMotion: true,
  });
}

/**
 * A single collapsible row: a blush header bar with a rotating chevron that
 * expands its children, popping a little theme-colored confetti on open.
 * Shared by the FAQ and Presents sections.
 */
export default function ConfettiAccordion({
  header,
  children,
  theme,
}: {
  header: ReactNode;
  children: ReactNode;
  theme: TemplateTheme;
}) {
  const [open, setOpen] = useState(false);
  const colors = [theme.primary, theme.secondary, theme.accent, "#FFFFFF"];

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !open;
    setOpen(next);
    if (next) burstAt(e.currentTarget, colors);
  };

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        background: `color-mix(in srgb, ${theme.secondary} 12%, transparent)`,
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "0.8rem 1rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: theme.uiFont,
          fontSize: "clamp(0.92rem, 3.6vw, 1.05rem)",
          color: theme.primary,
          lineHeight: 1.3,
        }}
      >
        <span>{header}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ display: "inline-flex", flexShrink: 0, color: theme.secondary }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 1rem 0.9rem" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
