"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DISPLAY_WHATSAPP_NUMBER } from "@/lib/landing-whatsapp";
import { type Currency } from "@/lib/currency/config";
import { formatUrgencySurcharge } from "@/lib/currency/urgency";
import { AnimatedSection } from "./AnimatedSection";
import { getFaqs } from "./landing-data";
import {
  getMotionProps,
  landingFastTransition,
  landingItemVariants,
  landingStaggerVariants,
  shouldReduceMotion,
} from "./landing-motion";
import { SectionEyebrow } from "./SectionEyebrow";

export function FaqSection({
  openIndex,
  setOpenIndex,
  currentCurrency,
}: {
  openIndex: number;
  setOpenIndex: (index: number) => void;
  currentCurrency: Currency;
}) {
  const t = useTranslations("LandingFaq");
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);
  const faqs = getFaqs(t, formatUrgencySurcharge(currentCurrency));

  return (
    <AnimatedSection id="faq" className="bg-background px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em]">
            {t("title")}
          </h2>
          <p className="mt-5 text-muted-foreground">{t("body")}</p>
          <div className="mt-8 rounded-2xl bg-muted p-6 text-sm text-primary">
            <p className="font-semibold text-foreground">{t("contactTitle")}</p>
            <p className="mt-2">WhatsApp · {DISPLAY_WHATSAPP_NUMBER}</p>
            <p>E-mail · ola@convites.brindealstudio.com</p>
          </div>
        </div>
        <motion.div
          {...getMotionProps(reduceMotion, landingStaggerVariants)}
          className="space-y-3"
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                layout
                variants={landingItemVariants}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
                >
                  {faq.question}
                  <motion.span
                    animate={reduced ? undefined : { rotate: isOpen ? 180 : 0 }}
                    transition={landingFastTransition}
                    className="text-muted-foreground"
                  >
                    <ChevronDownIcon className="size-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pt-4 text-sm leading-6 text-muted-foreground">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
