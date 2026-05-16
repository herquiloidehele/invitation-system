"use client";

import { motion } from "framer-motion";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import { invitationTypes } from "./landing-data";
import { SectionEyebrow } from "./SectionEyebrow";

export function TypesSection() {
  return (
    <AnimatedSection id="tipos" className="bg-[#F6F7F5] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Para cada celebração</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            Um convite para cada momento
          </h2>
          <p className="mt-5 text-[#5C605A]">
            Adapte o convite ao tipo de celebração. Cada modelo é refinado,
            único e pensado para emocionar.
          </p>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {invitationTypes.map((type) => (
            <motion.article
              key={type.title}
              whileHover={{ y: -8 }}
              className={`rounded-[1.5rem] p-7 transition ${
                type.featured
                  ? "bg-[#3F4E3F] text-white shadow-[0_24px_80px_rgba(63,78,63,0.24)]"
                  : "border border-[#E5E7E4] bg-white text-[#1F2420] shadow-[0_12px_40px_rgba(31,36,32,0.05)]"
              }`}
            >
              <div
                className={`mb-8 flex h-13 w-13 items-center justify-center rounded-2xl text-sm font-bold ${
                  type.featured
                    ? "bg-white/15 text-white"
                    : "bg-[#F6F7F5] text-[#3F4E3F]"
                }`}
              >
                {type.icon}
              </div>
              <h3 className="text-2xl font-semibold">{type.title}</h3>
              <p
                className={`mt-4 text-sm leading-6 ${
                  type.featured ? "text-[#E8EBE7]" : "text-[#5C605A]"
                }`}
              >
                {type.text}
              </p>
              <a
                href={buildWhatsappUrl(`Olá! Gostava de saber mais sobre ${type.title}.`)}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
              >
                Saber mais <span aria-hidden="true">→</span>
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
