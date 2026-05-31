"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { CustomTexts, InvitationData } from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { EditableCard } from "@/components/shared/EditableCard";
import { EditableText } from "@/components/shared/EditableText";
import {
  breatheAnimation,
  EASE,
  liftCardProps,
  WordReveal,
} from "@/components/shared/animations";
import { t } from "@/lib/custom-texts";
import { AnimatedSection, type ResolvedCardStyle } from "./_helpers";

// ---------------------------------------------------------------------------
// OurStory section — short narrative about the couple, with decorative
// heart. Only rendered when `invitation.ourStory?.enabled && description`.
// ---------------------------------------------------------------------------

interface OurStorySectionProps {
  ourStory: NonNullable<InvitationData["ourStory"]>;
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
  cardStyle: ResolvedCardStyle;
  isPreview?: boolean;
}

export default function OurStorySection({
  ourStory,
  ts,
  customTexts,
  cardStyle,
  isPreview,
}: OurStorySectionProps) {
  return (
    <>
      <AnimatedSection className="px-6 pb-2" isPreview={isPreview}>
        <div className="flex flex-col items-center">
          <span style={ts.sectionTitles}>
            <EditableText elementKey="sectionTitles">
              <WordReveal
                text={
                  ourStory.title || t(customTexts, "sectionTitle_ourStory")
                }
                isPreview={isPreview}
              />
            </EditableText>
          </span>

          <motion.div
            className="mt-3 mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            style={{
              width: 28,
              height: 1,
              background: ts.accent,
              opacity: 0.25,
              transformOrigin: "center",
            }}
          />
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
        <EditableCard sectionKey="ourStory">
          <motion.div
            {...liftCardProps}
            style={{
              background: cardStyle.cardBg,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: cardStyle.borderRadius,
              overflow: "hidden",
              padding: "28px 24px",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
              border: `1px solid ${cardStyle.cardBorder}`,
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: `${ts.accent}12` }}
                animate={breatheAnimation}
              >
                <Heart size={20} color={ts.accent} strokeWidth={1.5} />
              </motion.div>

              <p
                style={{
                  ...ts.bodyText,
                  textAlign: "center",
                  margin: 0,
                  whiteSpace: "pre-line",
                }}
              >
                <EditableText elementKey="bodyText">
                  {ourStory.description}
                </EditableText>
              </p>
            </div>
          </motion.div>
        </EditableCard>
      </AnimatedSection>
    </>
  );
}
