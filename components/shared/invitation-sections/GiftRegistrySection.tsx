"use client";

import { motion } from "framer-motion";
import { ExternalLink, Gift } from "lucide-react";
import type { CustomTexts, InvitationData } from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { EditableCard } from "@/components/shared/EditableCard";
import { EditableText } from "@/components/shared/EditableText";
import { EASE } from "@/components/shared/animations";
import { t } from "@/lib/custom-texts";
import { slideFromRight, type ResolvedCardStyle } from "./_helpers";

// ---------------------------------------------------------------------------
// GiftRegistry card — only rendered when `invitation.giftRegistry.enabled`.
// ---------------------------------------------------------------------------

interface GiftRegistrySectionProps {
  giftRegistry: NonNullable<InvitationData["giftRegistry"]>;
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
  cardStyle: ResolvedCardStyle;
  onGiftClick?: () => void;
}

export default function GiftRegistrySection({
  giftRegistry,
  ts,
  customTexts,
  cardStyle,
  onGiftClick,
}: GiftRegistrySectionProps) {
  return (
    <EditableCard sectionKey="giftRegistry">
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-40px" }}
        whileHover={{ y: -3, transition: { duration: 0.25, ease: EASE } }}
        className="flex flex-col items-center gap-3 text-center"
        style={{
          background: cardStyle.cardBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: cardStyle.borderRadius,
          padding: "24px 14px",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
          border: `1px solid ${cardStyle.cardBorder}`,
        }}
      >
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: `${ts.accent}12` }}
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 4.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
        >
          <Gift size={20} color={ts.accent} strokeWidth={1.5} />
        </motion.div>
        <span style={ts.labels}>
          <EditableText elementKey="labels">
            {t(customTexts, "sectionTitle_giftRegistry")}
          </EditableText>
        </span>
        <span
          style={{
            ...ts.giftText,
            whiteSpace: "pre-line",
          }}
        >
          <EditableText elementKey="giftText">
            {giftRegistry.text}
          </EditableText>
        </span>
        {giftRegistry.link && (
          <motion.a
            href={giftRegistry.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onGiftClick}
            className="flex items-center justify-center gap-1.5 mt-1 transition-opacity hover:opacity-70"
            style={ts.giftLink}
            whileHover={{ scale: 1.02 }}
          >
            <ExternalLink size={10} strokeWidth={1.5} />
            <EditableText elementKey="giftLink">
              {t(customTexts, "cta_giftLink")}
            </EditableText>
          </motion.a>
        )}
      </motion.div>
    </EditableCard>
  );
}
