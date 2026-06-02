"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import type { HeroFeature } from "@/lib/landing-features";
import { PhoneIframePreview } from "./PhoneIframePreview";
import { SectionEyebrow } from "./SectionEyebrow";

export function HeroSection({
  reduceMotion,
  feature,
}: {
  reduceMotion: boolean | null;
  feature: HeroFeature | null;
}) {
  return (
    <section
      id="top"
      className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[0.95fr_1fr] lg:gap-16 lg:pt-24"
    >
      <div className="absolute left-1/2 top-24 -z-0 h-72 w-72 rounded-full bg-[#E8EBE7] blur-3xl" />
      <HeroCopy reduceMotion={reduceMotion} />
      {!!feature && (
        <div className="relative z-10 mx-auto w-full max-w-[20rem] sm:max-w-[22rem] lg:max-w-[24rem]">
          <PhoneIframePreview
            title={feature.title || "Convite Brindeal"}
            src={feature.href}
            showCaption={false}
            animation="hero-float"
            reduceMotion={reduceMotion}
          />
        </div>
      )}
    </section>
  );
}

function HeroCopy({ reduceMotion }: { reduceMotion: boolean | null }) {
  const t = useTranslations("Landing");

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative z-10 max-w-3xl lg:pt-10"
    >
      <SectionEyebrow>{t("heroEyebrow")}</SectionEyebrow>
      <h1 className="mt-8 text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-[#3F4E3F] sm:text-6xl lg:text-7xl">
        <span className="block">{t("heroTitleLine1")}</span>
      </h1>
      <p className="mt-7 max-w-2xl text-md leading-8 text-[#5C605A]">
        {t("heroBody")}
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <a
          href={buildWhatsappUrl(t("defaultWhatsappMessage"))}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#3F4E3F] px-7 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_60px_rgba(63,78,63,0.24)] transition hover:-translate-y-0.5 hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
        >
          {t("heroPrimaryCta")}
        </a>
        <a
          href="#galeria"
          className="rounded-full border border-[#E5E7E4] px-7 py-4 text-center text-sm font-semibold text-[#1F2420] transition hover:-translate-y-0.5 hover:border-[#3F4E3F] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
        >
          {t("heroSecondaryCta")}
        </a>
      </div>
      <p className="mt-8 text-sm font-medium text-[#5C605A]">
        {t("heroProof")}
      </p>
    </motion.div>
  );
}
