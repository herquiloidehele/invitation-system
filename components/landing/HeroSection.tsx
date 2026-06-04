"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import type { HeroFeature } from "@/lib/landing-features";
import { SectionEyebrow } from "./SectionEyebrow";

export function HeroSection({
  reduceMotion,
}: {
  reduceMotion: boolean | null;
  feature: HeroFeature | null;
}) {
  return (
    <section
      id="top"
      className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[0.95fr_1fr] lg:gap-16 lg:pt-24"
    >
      <HeroCopy reduceMotion={reduceMotion} />
      <div className="relative z-10 mx-auto w-full max-w-[20rem] sm:max-w-88 lg:max-w-336">
        <video
          src="/videos/hero-phones-videos.mp4"
          autoPlay
          muted
          // loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="h-auto w-full"
        />
      </div>
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
      <h1 className="mt-8 text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-primary sm:text-6xl lg:text-7xl">
        <span className="block">{t("heroTitleLine1")}</span>
      </h1>
      <p className="mt-7 max-w-2xl text-md leading-8 text-muted-foreground">
        {t("heroBody")}
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <a
          href={buildWhatsappUrl(t("defaultWhatsappMessage"))}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-primary px-7 py-4 text-center text-sm font-semibold text-primary-foreground shadow-[0_18px_60px_color-mix(in_srgb,var(--primary)_24%,transparent)] transition hover:-translate-y-0.5 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
        >
          {t("heroPrimaryCta")}
        </a>
        <a
          href="#galeria"
          className="rounded-full border border-border px-7 py-4 text-center text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
        >
          {t("heroSecondaryCta")}
        </a>
      </div>
      <p className="mt-8 text-sm font-medium text-muted-foreground">
        {t("heroProof")}
      </p>
    </motion.div>
  );
}
