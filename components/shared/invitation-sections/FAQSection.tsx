"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type {
  CustomTexts,
  FAQItem,
  TemplateTheme,
} from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { EditableCard } from "@/components/shared/EditableCard";
import { EditableText } from "@/components/shared/EditableText";
import { EASE, WordReveal, staggerContainer } from "@/components/shared/animations";
import { t } from "@/lib/custom-texts";
import { AnimatedSection, fadeInUp, type ResolvedCardStyle } from "./_helpers";

// ---------------------------------------------------------------------------
// FAQ Accordion Item — redesigned with left accent border
// ---------------------------------------------------------------------------

function FAQAccordionItem({
  faq,
  isOpen,
  onToggle,
  theme,
  ts,
  isLast,
}: {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  isLast: boolean;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      style={{
        borderLeft: isOpen ? `2px solid ${ts.accent}` : "2px solid transparent",
        transition: "border-color 0.35s ease",
      }}
    >
      <motion.button
        onClick={onToggle}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="flex w-full cursor-pointer items-center gap-3 text-left transition-colors"
        style={{
          padding: "20px 22px",
          paddingBottom: isOpen ? 4 : 20,
          background: "transparent",
          border: "none",
        }}
      >
        <span
          className="flex-1"
          style={{
            ...ts.faqQuestion,
            color: isOpen ? ts.textPrimary : ts.textSecondary,
            transition: "color 0.3s ease",
          }}
        >
          <EditableText elementKey="faqQuestion">{faq.question}</EditableText>
        </span>

        <motion.span
          className="flex-shrink-0"
          animate={
            isOpen
              ? { rotate: 180, y: 0 }
              : { rotate: 0, y: [0, 2, 0] }
          }
          transition={
            isOpen
              ? { duration: 0.35, ease: EASE }
              : {
                  rotate: { duration: 0.35, ease: EASE },
                  y: {
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }
          }
        >
          <ChevronDown
            size={16}
            color={ts.accent}
            strokeWidth={1.5}
            style={{
              opacity: isOpen ? 1 : 0.4,
              transition: "opacity 0.3s ease",
            }}
          />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: EASE },
              opacity: { duration: 0.3, delay: 0.05 },
            }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "4px 22px 22px" }}>
              <p
                style={{
                  ...ts.faqAnswer,
                  margin: 0,
                }}
              >
                <EditableText elementKey="faqAnswer">{faq.answer}</EditableText>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLast && (
        <div
          style={{
            height: 1,
            background: theme.cardBorder,
            margin: "0 22px",
          }}
        />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// FAQ Section — the full block: title + decorative line + accordion card.
// State is owned here because no other section needs to know which item
// is open.
// ---------------------------------------------------------------------------

interface FAQSectionProps {
  faqs: FAQItem[];
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
  cardStyle: ResolvedCardStyle;
  isPreview?: boolean;
}

export default function FAQSection({
  faqs,
  theme,
  ts,
  customTexts,
  cardStyle,
  isPreview,
}: FAQSectionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
      <div className="flex flex-col items-center">
        <span style={ts.sectionTitles}>
          <EditableText elementKey="sectionTitles">
            <WordReveal
              text={t(customTexts, "sectionTitle_faqs")}
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

      <EditableCard sectionKey="faqs">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          {...(isPreview
            ? { animate: "visible" }
            : {
                whileInView: "visible",
                viewport: { once: false, margin: "-40px" },
              })}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{
            background: cardStyle.cardBg,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: cardStyle.borderRadius,
            overflow: "hidden",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
            border: `1px solid ${cardStyle.cardBorder}`,
          }}
        >
          {faqs.map((faq, i) => (
            <FAQAccordionItem
              key={i}
              faq={faq}
              isOpen={openFaqIndex === i}
              onToggle={() =>
                setOpenFaqIndex(openFaqIndex === i ? null : i)
              }
              theme={theme}
              ts={ts}
              isLast={i === faqs.length - 1}
            />
          ))}
        </motion.div>
      </EditableCard>
    </AnimatedSection>
  );
}
