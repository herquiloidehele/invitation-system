"use client";

import { motion } from "framer-motion";
import type { FAQItem, TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { efStyle } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";
import ScriptTitle from "./ScriptTitle";
import ConfettiAccordion from "./ConfettiAccordion";
import { efGroup, efItem, useRevealProps } from "./motion";

interface FaqSectionProps {
  faqs: FAQItem[];
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides | null;
  title?: string;
}

/** "Perguntas frequentes" — accordion; opening a question pops a little confetti. */
export default function FaqSection({
  faqs,
  theme,
  textStyles: ts,
  title = "Perguntas frequentes",
}: FaqSectionProps) {
  const reveal = useRevealProps();
  const items = (faqs ?? []).filter((f) => f.question?.trim());
  if (items.length === 0) return null;

  const answerStyle = efStyle(
    {
      fontFamily: theme.uiFont,
      fontSize: "clamp(0.85rem, 3.4vw, 1rem)",
      color: theme.textPrimary,
      lineHeight: 1.5,
    },
    ts,
    "efFaqAnswer",
  );

  return (
    <motion.section
      style={{ padding: "2rem clamp(1.5rem, 7vw, 3rem)", maxWidth: 520, marginInline: "auto" }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div variants={efItem}>
        <ScriptTitle theme={theme} textStyles={ts} style={{ marginBottom: "1.5rem" }}>
          {title}
        </ScriptTitle>
      </motion.div>

      <motion.div
        variants={efGroup}
        style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}
      >
        {items.map((f, i) => (
          <motion.div key={`${f.question}-${i}`} variants={efItem}>
            <ConfettiAccordion header={f.question} theme={theme} textStyles={ts}>
              <div style={answerStyle}>
                <EditableText elementKey="efFaqAnswer">{f.answer}</EditableText>
              </div>
            </ConfettiAccordion>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
