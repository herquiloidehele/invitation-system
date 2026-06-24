"use client";

import { motion } from "framer-motion";
import type { GiftRegistry, TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { efStyle } from "@/lib/elegant-floral";
import { giftsPagePath, hasGiftItems } from "@/lib/gift-registry";
import { EditableText } from "@/components/shared/EditableText";
import ScriptTitle from "./ScriptTitle";
import PillButton from "./PillButton";
import ConfettiAccordion from "./ConfettiAccordion";
import { efGroup, efItem, useRevealProps } from "./motion";

interface GiftsSectionProps {
  giftRegistry: GiftRegistry;
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides | null;
  /** Invitation slug — used to build the internal gifts-page link. */
  slug: string;
  /** Personal guest token to preserve on the gifts-page link. */
  guestToken?: string;
  title?: string;
  /** Accordion bar label that reveals the gift message + link. */
  label?: string;
  buttonLabel?: string;
}

/** "Presentes" — collapsible bar revealing the gift message + "Ver Lista", with confetti on open. */
export default function GiftsSection({
  giftRegistry,
  theme,
  textStyles: ts,
  slug,
  guestToken,
  title = "Presentes",
  label = "Opção presentear",
  buttonLabel = "Ver Lista",
}: GiftsSectionProps) {
  const reveal = useRevealProps();
  if (!giftRegistry?.enabled) return null;

  return (
    <motion.section
      id="gifts"
      style={{ padding: "2rem clamp(1rem, 4.5vw, 1.75rem)", maxWidth: 520, marginInline: "auto" }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div variants={efItem}>
        <ScriptTitle theme={theme} textStyles={ts} style={{ marginBottom: "3rem" }}>
          {title}
        </ScriptTitle>
      </motion.div>

      <motion.div variants={efItem}>
        <ConfettiAccordion header={label} theme={theme} textStyles={ts}>
          {giftRegistry.text && (
            <p
              style={efStyle(
                {
                  margin: "0.2rem 0 0",
                  textAlign: "center",
                  fontFamily: theme.bodyFont,
                  color: theme.textSecondary,
                  fontSize: "clamp(0.96rem, 3.7vw, 1.16rem)",
                  lineHeight: 1.6,
                },
                ts,
                "efBody",
              )}
            >
              <EditableText elementKey="efBody">{giftRegistry.text}</EditableText>
            </p>
          )}
          {hasGiftItems(giftRegistry) ? (
            <div style={{ marginTop: "1.3rem", textAlign: "center" }}>
              <PillButton
                internal
                href={giftsPagePath(slug, guestToken)}
                theme={theme}
                textStyles={ts}
              >
                {buttonLabel}
              </PillButton>
            </div>
          ) : giftRegistry.link ? (
            <div style={{ marginTop: "1.3rem", textAlign: "center" }}>
              <PillButton href={giftRegistry.link} theme={theme} textStyles={ts}>
                {buttonLabel}
              </PillButton>
            </div>
          ) : null}
        </ConfettiAccordion>
      </motion.div>
    </motion.section>
  );
}
