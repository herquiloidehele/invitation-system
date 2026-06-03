"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DISPLAY_WHATSAPP_NUMBER } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import { getFaqs } from "./landing-data";
import { SectionEyebrow } from "./SectionEyebrow";

export function FaqSection({
  openIndex,
  setOpenIndex,
}: {
  openIndex: number;
  setOpenIndex: (index: number) => void;
}) {
  const t = useTranslations("LandingFaq");
  const faqs = getFaqs(t);

  return (
    <AnimatedSection id="faq" className="bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em]">
            {t("title")}
          </h2>
          <p className="mt-5 text-[#5C605A]">{t("body")}</p>
          <div className="mt-8 rounded-2xl bg-[#F6F7F5] p-6 text-sm text-[#3F4E3F]">
            <p className="font-semibold text-[#1F2420]">{t("contactTitle")}</p>
            <p className="mt-2">WhatsApp · {DISPLAY_WHATSAPP_NUMBER}</p>
            <p>E-mail · ola@convites.brindealstudio.com</p>
          </div>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                layout
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-[#E5E7E4] bg-white p-5"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
                >
                  {faq.question}
                  <span className="text-[#5C605A]">
                    {isOpen ? (
                      <ChevronUpIcon className="size-5" />
                    ) : (
                      <ChevronDownIcon className="size-5" />
                    )}
                  </span>
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
                      <p className="pt-4 text-sm leading-6 text-[#5C605A]">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}
