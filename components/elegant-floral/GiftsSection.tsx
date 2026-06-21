"use client";

import { motion } from "framer-motion";
import type { GiftRegistry, TemplateTheme } from "@/lib/types";
import ScriptTitle from "./ScriptTitle";
import PillButton from "./PillButton";
import ConfettiAccordion from "./ConfettiAccordion";
import { efGroup, efItem, useRevealProps } from "./motion";

interface GiftsSectionProps {
  giftRegistry: GiftRegistry;
  theme: TemplateTheme;
  title?: string;
  /** Accordion bar label that reveals the gift message + link. */
  label?: string;
  buttonLabel?: string;
}

/** "Presentes" — collapsible bar revealing the gift message + "Ver Lista", with confetti on open. */
export default function GiftsSection({
  giftRegistry,
  theme,
  title = "Presentes",
  label = "Opção presentear",
  buttonLabel = "Ver Lista",
}: GiftsSectionProps) {
  const reveal = useRevealProps();
  if (!giftRegistry?.enabled) return null;

  return (
    <motion.section
      style={{ padding: "2rem clamp(1.5rem, 7vw, 3rem)", maxWidth: 520, marginInline: "auto" }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div variants={efItem}>
        <ScriptTitle theme={theme} style={{ marginBottom: "1.5rem" }}>
          {title}
        </ScriptTitle>
      </motion.div>

      <motion.div variants={efItem}>
        <ConfettiAccordion header={label} theme={theme}>
          {giftRegistry.text && (
            <p
              style={{
                margin: "0.2rem 0 0",
                textAlign: "center",
                fontFamily: theme.bodyFont,
                color: theme.textSecondary,
                fontSize: "clamp(0.96rem, 3.7vw, 1.16rem)",
                lineHeight: 1.6,
              }}
            >
              {giftRegistry.text}
            </p>
          )}
          {giftRegistry.link && (
            <div style={{ marginTop: "1.3rem", textAlign: "center" }}>
              <PillButton href={giftRegistry.link} theme={theme}>
                {buttonLabel}
              </PillButton>
            </div>
          )}
        </ConfettiAccordion>
      </motion.div>
    </motion.section>
  );
}
