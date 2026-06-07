"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import type { HeroFeature } from "@/lib/landing-features";
import {
  getMotionProps,
  landingCardTap,
  landingItemVariants,
  landingStaggerVariants,
  landingTransition,
  shouldReduceMotion,
} from "./landing-motion";
import { SectionEyebrow } from "./SectionEyebrow";

const heroPhoneVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...landingTransition, delay: 0.16 },
  },
};

export function HeroSection({
  reduceMotion,
}: {
  reduceMotion: boolean | null;
  feature: HeroFeature | null;
}) {
  return (
    <motion.section
      id="top"
      {...getMotionProps(reduceMotion, landingStaggerVariants, "animate")}
      className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[0.95fr_1fr] lg:gap-16 lg:pt-24"
    >
      <HeroCopy reduceMotion={reduceMotion} />
      <motion.div
        variants={heroPhoneVariants}
        className="relative z-10 mx-auto w-full max-w-[20rem] sm:max-w-88 lg:max-w-336"
      >
        <video
          src="https://invitation-system-media.s3.us-east-1.amazonaws.com/uploads/videos/1780761037157-hero-phones-videos.mp4"
          poster={"/images/hero-placeholder.jpg"}
          autoPlay
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="h-auto w-full"
        />
      </motion.div>
    </motion.section>
  );
}

function HeroCopy({ reduceMotion }: { reduceMotion: boolean | null }) {
  const t = useTranslations("Landing");
  const reduced = shouldReduceMotion(reduceMotion);

  return (
    <motion.div
      variants={landingStaggerVariants}
      className="relative z-10 max-w-3xl lg:pt-10"
    >
      <motion.div variants={landingItemVariants}>
        <SectionEyebrow>{t("heroEyebrow")}</SectionEyebrow>
      </motion.div>
      <motion.h1
        variants={landingItemVariants}
        className="mt-8 text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-primary sm:text-6xl lg:text-7xl"
      >
        <span className="block">{t("heroTitleLine1")}</span>
      </motion.h1>
      <motion.p
        variants={landingItemVariants}
        className="mt-7 max-w-2xl text-md leading-8 text-muted-foreground"
      >
        {t("heroBody")}
      </motion.p>
      <motion.div
        variants={landingItemVariants}
        className="mt-9 flex flex-col gap-3 sm:flex-row"
      >
        <motion.a
          href={buildWhatsappUrl(t("defaultWhatsappMessage"))}
          target="_blank"
          rel="noreferrer"
          whileHover={reduced ? undefined : { y: -2 }}
          whileTap={reduced ? undefined : landingCardTap}
          className="rounded-full bg-primary px-7 py-4 text-center text-sm font-semibold text-primary-foreground shadow-[0_18px_60px_color-mix(in_srgb,var(--primary)_24%,transparent)] transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
        >
          {t("heroPrimaryCta")}
        </motion.a>
        <motion.a
          href="#galeria"
          whileHover={reduced ? undefined : { y: -2 }}
          whileTap={reduced ? undefined : landingCardTap}
          className="rounded-full border border-border px-7 py-4 text-center text-sm font-semibold text-foreground transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
        >
          {t("heroSecondaryCta")}
        </motion.a>
      </motion.div>
      <motion.p
        variants={landingItemVariants}
        className="mt-8 text-sm font-medium text-muted-foreground"
      >
        {t("heroProof")}
      </motion.p>
    </motion.div>
  );
}
