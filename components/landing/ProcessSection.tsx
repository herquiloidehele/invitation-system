"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  type LucideIcon,
  MessageSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import {
  getMotionProps,
  landingCardHover,
  landingCardTap,
  landingCardVariants,
  landingFastTransition,
  landingItemVariants,
  landingStaggerVariants,
  shouldReduceMotion,
} from "./landing-motion";
import { getProcessBadges, getProcessSteps } from "./landing-data";
import { SectionEyebrow } from "./SectionEyebrow";

const STEP_ICONS: LucideIcon[] = [
  MessageSquare,
  CreditCard,
  CheckCircle2,
  ArrowUpRight,
];

export function ProcessSection() {
  const t = useTranslations("LandingProcess");
  const landingT = useTranslations("Landing");
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);
  const badges = getProcessBadges(t);
  const processSteps = getProcessSteps(t);

  return (
    <AnimatedSection
      id="processo"
      className="bg-muted px-5 py-24 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-muted-foreground">{t("body")}</p>
        </div>
        <motion.div
          {...getMotionProps(reduceMotion, landingStaggerVariants)}
          className="mt-16 grid gap-5 lg:grid-cols-2"
        >
          {processSteps.map(([number, title, text], index) => {
            const dark = index === 0;

            return (
              <motion.article
                key={number}
                variants={landingCardVariants}
                whileHover={reduced ? undefined : landingCardHover}
                whileTap={reduced ? undefined : landingCardTap}
                className={`min-h-[320px] rounded-[1.5rem] p-7 shadow-[0_18px_55px_color-mix(in_srgb,var(--foreground)_5%,transparent)] sm:p-8 ${
                  dark
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <p
                    className={`text-5xl font-semibold leading-none ${dark ? "text-primary-foreground" : "text-primary"}`}
                  >
                    {number}
                  </p>
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${
                      dark
                        ? "bg-primary-foreground/12 text-primary-foreground"
                        : "bg-muted text-primary"
                    }`}
                    aria-hidden="true"
                  >
                    {(() => {
                      const Icon = STEP_ICONS[index] ?? MessageSquare;
                      return <Icon className="size-5" />;
                    })()}
                  </span>
                </div>
                <h3 className="mt-7 text-2xl font-semibold tracking-[-0.02em]">
                  {title}
                </h3>
                <p
                  className={`mt-5 text-sm leading-7 ${dark ? "text-primary-soft" : "text-muted-foreground"}`}
                >
                  {text}
                </p>
                <span
                  className={`mt-6 inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] ${
                    dark
                      ? "bg-primary-foreground/14 text-primary-foreground"
                      : "border border-border bg-card text-foreground"
                  }`}
                >
                  • {badges[index]}
                </span>
                <ProcessPreview index={index} reduceMotion={reduceMotion} />
              </motion.article>
            );
          })}
        </motion.div>
        <div className="mt-14 flex flex-col items-center justify-center gap-5 text-center sm:flex-row">
          <p className="text-2xl font-medium text-foreground">{t("closing")}</p>
          <a
            href={buildWhatsappUrl(landingT("defaultWhatsappMessage"))}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
          >
            {t("cta")}
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}

function ProcessPreview({
  index,
  reduceMotion,
}: {
  index: number;
  reduceMotion: boolean | null;
}) {
  const t = useTranslations("LandingProcess");
  const reduced = shouldReduceMotion(reduceMotion);

  if (index === 0) {
    return (
      <motion.div
        variants={landingItemVariants}
        className="mt-6 space-y-2 rounded-2xl bg-primary-deep/85 p-4 text-xs text-primary-foreground/10"
      >
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...landingFastTransition, delay: 0.1 }}
          className="flex items-end gap-2"
        >
          <div className="rounded-2xl rounded-bl-sm bg-background px-3 py-2 text-foreground shadow-sm">
            {t("previewMessageA")}
          </div>
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/45">
            10:24
          </span>
        </motion.div>
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...landingFastTransition, delay: 0.22 }}
          className="flex items-end justify-end gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/45">
            10:26
          </span>
          <div className="rounded-2xl rounded-br-sm bg-primary-muted px-3 py-2 text-primary-foreground shadow-sm">
            {t("previewMessageB")}
          </div>
        </motion.div>
        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-white/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:240ms]" />
          {t("typing")}
        </div>
      </motion.div>
    );
  }

  if (index === 1) {
    return (
      <div className="mt-6 rounded-2xl bg-muted p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          {t("paymentTitle")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-card px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t("paymentOptionA")}
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">50%</p>
          </div>
          <div className="rounded-xl border border-primary bg-primary px-3 py-2 text-primary-foreground">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
              {t("paymentOptionB")}
            </p>
            <p className="mt-1 text-xl font-semibold">100%</p>
          </div>
        </div>
        <motion.div
          animate={reduced ? undefined : { scale: [1, 1.03, 1] }}
          transition={
            reduced
              ? undefined
              : {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: landingFastTransition.ease,
                }
          }
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-[10px] font-semibold text-primary shadow-sm"
        >
          <CheckCircle2 className="size-3.5" />
          <span>{t("paymentConfirmed")}</span>
        </motion.div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <>
        <div className="mt-6 grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-muted p-4">
          <div className="relative h-24 w-16 overflow-hidden rounded-lg bg-background shadow-sm">
            <div className="absolute inset-x-2 top-2 h-2 rounded-full bg-muted-strong" />
            <div className="absolute inset-x-2 top-5 h-2 w-8 rounded-full bg-muted-strong" />
            <div className="absolute inset-x-2 top-9 h-8 rounded-md bg-primary-soft" />
            <span className="absolute -right-1 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              1
            </span>
            <span className="absolute -left-1 bottom-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              2
            </span>
          </div>
          <div className="space-y-2 text-[11px] text-foreground">
            <div className="flex items-center gap-2">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground motion-safe:animate-pulse">
                1
              </span>
              {t("revisionA")}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground motion-safe:animate-pulse">
                2
              </span>
              {t("revisionB")}
            </div>
            <span className="inline-flex rounded-full bg-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
              {t("versionApproved")}
            </span>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
          {t("revisionFees")}
        </p>
      </>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-muted p-4 text-xs text-foreground">
      <div className="grid h-24 w-14 place-items-center rounded-xl border-[3px] border-primary bg-background">
        <div className="space-y-1">
          <span className="block h-1.5 w-7 rounded-full bg-muted-strong" />
          <span className="block h-3 w-7 rounded-md bg-primary" />
          <span className="block h-1.5 w-5 rounded-full bg-muted-strong" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-full bg-background px-3 py-1.5 text-[11px] shadow-sm">
          <span>{t("confirmed")}</span>
          <span className="font-semibold text-primary">142</span>
        </div>
        <div className="flex items-center justify-between rounded-full bg-background px-3 py-1.5 text-[11px] shadow-sm">
          <span>{t("messages")}</span>
          <span className="font-semibold text-primary">18</span>
        </div>
        <motion.div
          animate={reduced ? undefined : { opacity: [0.82, 1, 0.82] }}
          transition={
            reduced
              ? undefined
              : {
                  duration: 2.2,
                  repeat: Infinity,
                  ease: landingFastTransition.ease,
                }
          }
          className="flex items-center justify-between rounded-full bg-primary px-3 py-1.5 text-[11px] text-primary-foreground"
        >
          <span>{t("realTime")}</span>
          <span className="font-semibold">{t("live")}</span>
        </motion.div>
      </div>
    </div>
  );
}
