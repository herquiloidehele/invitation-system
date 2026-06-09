"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Languages,
  Palette,
  Sparkles,
  UserPen,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type Currency } from "@/lib/currency/config";
import { personalizationTierPrices } from "@/lib/landing-price";
import { AnimatedSection } from "./AnimatedSection";
import {
  getMotionProps,
  landingCardHover,
  landingCardTap,
  landingCardVariants,
  landingFastTransition,
  landingItemVariants,
  landingStaggerVariants,
  landingTransition,
  shouldReduceMotion,
} from "./landing-motion";
import { landingImages } from "./landing-images";
import { SectionEyebrow } from "./SectionEyebrow";

export function FeaturesSection({ currentCurrency }: { currentCurrency: Currency }) {
  const t = useTranslations("LandingFeatures");
  const reduceMotion = useReducedMotion();

  return (
    <AnimatedSection
      id="recursos"
      className="bg-background px-5 py-24 sm:px-8 lg:py-28"
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
          className="mt-14 grid gap-5 lg:grid-cols-12"
        >
          <RsvpHero />

          <div className="grid gap-5 lg:col-span-5">
            <FeatureWideCard
              icon="♫"
              title={t("musicTitle")}
              text={t("musicText")}
              visual={<MusicPlayer />}
            />
            <FeatureWideCard
              icon="◎"
              title={t("mapTitle")}
              text={t("mapText")}
              visual={<MapTile />}
            />
          </div>

          <FeatureSmallCard
            icon={Users}
            title={t("guestsTitle")}
            text={t("guestsText")}
          >
            <GuestTable />
          </FeatureSmallCard>

          <FeatureSmallCard
            icon={BarChart3}
            title={t("analyticsTitle")}
            text={t("analyticsText")}
          >
            <AnalyticsChart />
          </FeatureSmallCard>

          <FeatureSmallCard
            icon={Languages}
            title={t("languagesTitle")}
            text={t("languagesText")}
            tinted
          >
            <LanguageList />
          </FeatureSmallCard>

          <FeatureSmallCard
            icon={Palette}
            title={t("customTitle")}
            text={t("customText")}
          >
            <CustomizationPanel />
          </FeatureSmallCard>

          <PersonalizationCard currentCurrency={currentCurrency} />
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

function RsvpHero() {
  const t = useTranslations("LandingFeatures");
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);

  return (
    <motion.article
      variants={landingCardVariants}
      whileHover={reduced ? undefined : landingCardHover}
      whileTap={reduced ? undefined : landingCardTap}
      className="flex min-h-[360px] flex-col rounded-[1.75rem] bg-primary p-8 text-primary-foreground sm:p-10 lg:col-span-7 lg:min-h-[430px]"
    >
      <h3 className="text-4xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl">
        {t("rsvpTitle")}
      </h3>
      <p className="mt-4 max-w-xl text-sm leading-7 text-primary-soft sm:text-base">
        {t("rsvpBody")}
      </p>
      <div className="relative mt-7 min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-primary-foreground/10 bg-card shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <Image
          src="/images/rsvp-confirmation-page.png"
          alt={t("rsvpImageAlt")}
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover object-top"
        />
      </div>
    </motion.article>
  );
}

function FeatureWideCard({
  icon,
  title,
  text,
  visual,
}: {
  icon: string;
  title: string;
  text: string;
  visual: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);

  return (
    <motion.article
      variants={landingCardVariants}
      whileHover={reduced ? undefined : landingCardHover}
      whileTap={reduced ? undefined : landingCardTap}
      className="grid min-h-[205px] grid-cols-[1fr_auto] items-center gap-6 rounded-[1.75rem] border border-border bg-card p-7 shadow-[0_12px_40px_color-mix(in_srgb,var(--foreground)_3.5%,transparent)] sm:p-8"
    >
      <div>
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-muted text-xl text-primary">
          {icon}
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
      {visual}
    </motion.article>
  );
}

function FeatureSmallCard({
  icon: Icon = Sparkles,
  title,
  text,
  children,
  tinted,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);

  return (
    <motion.article
      variants={landingCardVariants}
      whileHover={reduced ? undefined : landingCardHover}
      whileTap={reduced ? undefined : landingCardTap}
      className={`rounded-[1.5rem] border border-border p-6 shadow-[0_12px_40px_color-mix(in_srgb,var(--foreground)_3.5%,transparent)] lg:col-span-3 ${
        tinted ? "bg-primary-soft" : "bg-card"
      }`}
    >
      <div className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-muted text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
      {children}
    </motion.article>
  );
}

function MusicPlayer() {
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);

  return (
    <div
      className="grid w-40 grid-cols-[auto_1fr] items-center gap-3 rounded-2xl bg-muted p-3 shadow-inner"
      aria-hidden="true"
    >
      <motion.span
        animate={reduced ? undefined : { scale: [1, 1.06, 1] }}
        transition={
          reduced
            ? undefined
            : { duration: 2.4, repeat: Infinity, ease: landingTransition.ease }
        }
        className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        ▶
      </motion.span>
      <div>
        <p className="text-[11px] font-semibold text-foreground">Marry Me</p>
        <p className="text-[10px] text-muted-foreground">Train · 02:46</p>
      </div>
    </div>
  );
}

function MapTile() {
  const t = useTranslations("LandingFeatures");
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);

  return (
    <div
      className="relative h-24 w-32 overflow-hidden rounded-2xl border border-border bg-muted"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--map-from)_0%,var(--map-to)_100%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_10px,color-mix(in_srgb,var(--primary)_7%,transparent)_10px_11px),repeating-linear-gradient(-45deg,transparent_0_10px,color-mix(in_srgb,var(--primary)_7%,transparent)_10px_11px)]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 128 96"
        fill="none"
      >
        <motion.path
          d="M8 78 Q 40 60 60 50 T 110 22"
          className="stroke-primary"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="4 4"
          fill="none"
          animate={reduced ? undefined : { pathLength: [0.45, 1, 0.45] }}
          transition={
            reduced
              ? undefined
              : { duration: 3, repeat: Infinity, ease: landingTransition.ease }
          }
        />
      </svg>
      <motion.span
        animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
        transition={
          reduced
            ? undefined
            : { duration: 2.6, repeat: Infinity, ease: landingTransition.ease }
        }
        className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-white shadow"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
      </motion.span>
      <span className="absolute bottom-2 left-2 rounded-full bg-background px-2 py-0.5 text-[9px] font-semibold text-primary shadow">
        {t("mapVenue")}
      </span>
    </div>
  );
}

function GuestTable() {
  const t = useTranslations("LandingFeatures");
  const rows = [
    { name: "Leonor S.", table: 1, state: "✓" },
    { name: "Diogo M.", table: 1, state: "✓" },
    { name: "Sara F.", table: 3, state: "·" },
  ];

  return (
    <div className="mt-5 overflow-hidden rounded-xl bg-muted">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        <span>{t("guest")}</span>
        <span>{t("table")}</span>
        <span>RSVP</span>
      </div>
      <div className="space-y-1 px-2 pb-2">
        {rows.map((row, index) => (
          <motion.div
            key={row.name}
            variants={landingItemVariants}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-card px-2 py-1.5 text-xs"
          >
            <span className="flex items-center gap-2 truncate">
              <span
                className={`h-4 w-4 rounded-full ${index === 2 ? "bg-border" : "bg-primary"}`}
              />
              {row.name}
            </span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {row.table}
            </span>
            <span
              className={`text-[11px] font-bold ${
                row.state === "✓" ? "text-primary" : "text-faint-foreground"
              }`}
            >
              {row.state}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsChart() {
  const t = useTranslations("LandingFeatures");
  const reduceMotion = useReducedMotion();
  const bars = [22, 40, 30, 48, 63, 54, 78];

  return (
    <>
      <div className="mt-5 rounded-xl bg-muted p-4">
        <div className="flex items-end justify-between text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span>{t("visits")}</span>
          <span>RSVPs</span>
        </div>
        <div className="mt-3 flex h-20 items-end justify-between gap-3">
          {bars.map((height, index) => (
            <motion.span
              key={index}
              initial={reduceMotion ? false : { scaleY: 0.35, opacity: 0.65 }}
              whileInView={reduceMotion ? undefined : { scaleY: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ...landingFastTransition, delay: index * 0.05 }}
              className={`w-4 origin-bottom rounded-sm ${
                index === bars.length - 1 ? "bg-primary" : "bg-primary-muted"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-faint-foreground">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
      </div>
    </>
  );
}

function LanguageList() {
  const languages = [
    { label: "Português", flagClassName: "bg-primary" },
    { label: "English", flagClassName: "bg-primary-muted" },
    { label: "Español", flagClassName: "bg-primary-pale" },
  ];

  return (
    <div className="mt-5 space-y-2">
      {languages.map((language) => (
        <motion.div
          key={language.label}
          variants={landingItemVariants}
          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
        >
          <span className="flex items-center gap-2">
            <span className={`h-4 w-4 rounded-sm ${language.flagClassName}`} />
            {language.label}
          </span>
          <span className="text-primary">✓</span>
        </motion.div>
      ))}
    </div>
  );
}

function CustomizationPanel() {
  const t = useTranslations("LandingProcess");
  const tiles = [
    { src: landingImages.personalisationA, alt: "Casal" },
    { src: landingImages.personalisationB, alt: "Flores" },
    { src: landingImages.personalisationC, alt: "Papelaria" },
  ];

  return (
    <>
      <div className="mt-5 flex gap-2">
        {tiles.map((tile) => (
          <motion.span
            key={tile.src}
            variants={landingItemVariants}
            className="relative block h-12 w-12 overflow-hidden rounded-lg"
          >
            <Image
              src={tile.src}
              alt={tile.alt}
              fill
              sizes="48px"
              className="object-cover"
            />
          </motion.span>
        ))}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        {t("palette")}
      </p>
      <div className="mt-2 flex gap-2">
        {[
          "bg-primary",
          "bg-primary-hover",
          "bg-primary-soft",
          "bg-muted-strong",
        ].map((className) => (
          <motion.span
            key={className}
            variants={landingItemVariants}
            className={`h-7 w-7 rounded-lg ${className}`}
          />
        ))}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        {t("typography")}
      </p>
      <p className="mt-1.5 text-2xl font-semibold text-foreground">
        Aa{" "}
        <span className="text-base font-normal text-muted-foreground">
          Manrope
        </span>
      </p>
    </>
  );
}

function PersonalizationCard({ currentCurrency }: { currentCurrency: Currency }) {
  const t = useTranslations("LandingFeatures");
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);
  const labels = t.raw("personalizationTierLabels") as readonly string[];
  const prices = personalizationTierPrices(currentCurrency);

  return (
    <motion.article
      variants={landingCardVariants}
      whileHover={reduced ? undefined : landingCardHover}
      whileTap={reduced ? undefined : landingCardTap}
      className="rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_12px_40px_color-mix(in_srgb,var(--foreground)_3.5%,transparent)] sm:p-8 lg:col-span-12"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-5 sm:max-w-2xl">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-primary">
            <UserPen className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
              {t("personalizationTitle")}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("personalizationText")}
            </p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <motion.button
                type="button"
                whileHover={reduced ? undefined : { y: -2 }}
                whileTap={reduced ? undefined : landingCardTap}
                className="shrink-0 self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
              />
            }
          >
            {t("personalizationCta")}
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("personalizationModalTitle")}</DialogTitle>
              <DialogDescription>
                {t("personalizationModalDescription")}
              </DialogDescription>
            </DialogHeader>
            <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-muted">
              {labels.map((label, i) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <span className="text-sm text-foreground">{label}</span>
                  <span className="text-right">
                    <span className="block text-lg font-semibold text-primary">
                      {prices[i]}
                    </span>
                    <span className="block text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                      {t("personalizationPerInvite")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      </div>
    </motion.article>
  );
}
