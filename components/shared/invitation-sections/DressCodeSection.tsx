"use client";

import { motion } from "framer-motion";
import { Shirt } from "lucide-react";
import type { CustomTexts, InvitationData } from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { EditableCard } from "@/components/shared/EditableCard";
import { EditableText } from "@/components/shared/EditableText";
import {
  EASE,
  floatAnimation,
  popIn,
  quickStagger,
} from "@/components/shared/animations";
import { t } from "@/lib/custom-texts";
import { slideFromLeft, type ResolvedCardStyle } from "./_helpers";

// ---------------------------------------------------------------------------
// DressCode card — only rendered when `invitation.dressCode.enabled`.
// ---------------------------------------------------------------------------

interface DressCodeSectionProps {
  dressCode: NonNullable<InvitationData["dressCode"]>;
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
  cardStyle: ResolvedCardStyle;
  isPreview?: boolean;
}

export default function DressCodeSection({
  dressCode,
  ts,
  customTexts,
  cardStyle,
  isPreview,
}: DressCodeSectionProps) {
  return (
    <EditableCard sectionKey="dressCode">
      <motion.div
        variants={slideFromLeft}
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
          animate={floatAnimation}
        >
          <Shirt size={20} color={ts.accent} strokeWidth={1.5} />
        </motion.div>
        <span style={ts.labels}>
          <EditableText elementKey="labels">
            {t(customTexts, "sectionTitle_dressCode")}
          </EditableText>
        </span>
        <EditableText elementKey="dressCodeText">
          <span
            style={{
              ...ts.dressCodeText,
              whiteSpace: "pre-line",
            }}
          >
            {dressCode.text}
          </span>
        </EditableText>
        {(dressCode.colors?.length ?? 0) > 0 && (
          <motion.div
            className="mt-1 flex items-center justify-center gap-2.5"
            variants={quickStagger}
            initial="hidden"
            {...(isPreview
              ? { animate: "visible" }
              : {
                  whileInView: "visible",
                  viewport: { once: false, margin: "-20px" },
                })}
          >
            {dressCode.colors!.map((color, i) => (
              <motion.span
                key={i}
                variants={popIn}
                whileHover={{
                  scale: 1.15,
                  transition: { duration: 0.2, ease: EASE },
                }}
                className="inline-block rounded-full"
                style={{
                  backgroundColor: color,
                  width: 28,
                  height: 28,
                  border: "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer",
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </EditableCard>
  );
}
