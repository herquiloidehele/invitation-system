"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Camera,
  CircleHelp,
  Clock3,
  Download,
  Gift,
  HeartHandshake,
  Languages,
  type LucideIcon,
  MapPinned,
  MessageCircle,
  Music2,
  Palette,
  Share2,
  Shirt,
  Users,
  Utensils,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatedSection } from "./AnimatedSection";
import { landingItemVariants, landingStaggerVariants } from "./landing-motion";
import { SectionEyebrow } from "./SectionEyebrow";
import { PhoneIframePreview } from "./PhoneIframePreview";
import {
  CONSTELLATION_GROUPS,
  type ConstellationFeatureKey,
  type ConstellationGroup,
  type ConstellationGroupKey,
  type ConstellationPreview,
} from "./landing-constellation-data";

const FEATURE_ICONS: Record<ConstellationFeatureKey, LucideIcon> = {
  animatedEntrance: Video,
  music: Music2,
  customDesign: Palette,
  socialPreview: Share2,
  countdown: Clock3,
  schedule: CalendarDays,
  coupleStory: HeartHandshake,
  photoGallery: Camera,
  dressCode: Shirt,
  maps: MapPinned,
  calendar: CalendarDays,
  giftRegistry: Gift,
  guestGuide: BookOpen,
  faqs: CircleHelp,
  languages: Languages,
  personalizedRsvp: HeartHandshake,
  partyResponses: Users,
  dietaryNotes: Utensils,
  customAnswers: MessageCircle,
  guestTracking: Users,
  whatsapp: MessageCircle,
  pdfExport: Download,
};

const CLUSTER_POSITIONS: Record<ConstellationGroupKey, string> = {
  entrance: "lg:col-start-1 lg:row-start-1 lg:self-end",
  story: "lg:col-start-1 lg:row-start-2 lg:self-start",
  guide: "lg:col-start-3 lg:row-start-1 lg:self-end",
  organize: "lg:col-start-3 lg:row-start-2 lg:self-start",
};

export function InvitationConstellationSection({
  preview,
}: {
  preview: ConstellationPreview | null;
}) {
  const t = useTranslations("LandingConstellation");
  const hasPreview = preview !== null;

  return (
    <AnimatedSection
      className="bg-muted px-5 py-24 sm:px-8 lg:py-28"
      variants={landingStaggerVariants}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-balance text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-muted-foreground">{t("body")}</p>
        </header>

        <motion.div
          variants={landingStaggerVariants}
          className="relative mx-auto mt-16 max-w-6xl"
        >
          {hasPreview ? <ConstellationSpine /> : null}
          <div
            className={`relative z-10 grid gap-7 ${
              hasPreview
                ? "lg:min-h-[760px] lg:grid-cols-[minmax(0,1fr)_21rem_minmax(0,1fr)] lg:grid-rows-2 lg:gap-x-16 lg:gap-y-12"
                : "lg:grid-cols-2"
            }`}
          >
            {preview ? <InvitationPreview preview={preview} /> : null}

            {CONSTELLATION_GROUPS.map((group, index) => (
              <FeatureCluster
                key={group.key}
                group={group}
                title={t(`groups.${group.key}.title`)}
                translateFeature={(key) => t(`features.${key}`)}
                staggerIndex={index}
                hasPreview={hasPreview}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

function InvitationPreview({ preview }: { preview: ConstellationPreview }) {
  return (
    <motion.div
      variants={landingItemVariants}
      className="relative mx-auto mb-7 w-full max-w-72 self-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mb-0 lg:max-w-none"
    >
      <PhoneIframePreview
        title={preview.title}
        src={preview.href}
        showCaption={false}
        loading={undefined}
        lazyExternalIframe
      />
    </motion.div>
  );
}

function FeatureCluster({
  group,
  title,
  translateFeature,
  staggerIndex,
  hasPreview,
}: {
  group: ConstellationGroup;
  title: string;
  translateFeature: (key: ConstellationFeatureKey) => string;
  staggerIndex: number;
  hasPreview: boolean;
}) {
  return (
    <motion.section
      variants={landingItemVariants}
      className={`group relative rounded-[1.75rem] bg-card p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_5px_rgba(0,0,0,0.04),0_18px_48px_rgba(0,0,0,0.06)] transition-[box-shadow,transform] duration-300 ease-out hover:shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_4px_10px_rgba(0,0,0,0.05),0_24px_60px_rgba(0,0,0,0.08)] sm:p-6 ${
        staggerIndex % 2 === 0 ? "sm:mr-8 lg:mr-0" : "sm:ml-8 lg:ml-0"
      } ${hasPreview ? CLUSTER_POSITIONS[group.key] : ""}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1/2 h-px w-16 -translate-y-1/2 bg-primary/35 transition-colors duration-300 group-hover:bg-primary ${
          hasPreview ? "hidden lg:block" : "hidden"
        } ${
          group.key === "entrance" || group.key === "story"
            ? "-right-16"
            : "-left-16"
        }`}
      />
      <h3 className="flex items-center gap-3 border-b border-border/70 pb-5 text-balance text-sm font-semibold tracking-[-0.01em] text-foreground">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold tabular-nums text-primary-foreground">
          {String(staggerIndex + 1).padStart(2, "0")}
        </span>
        {title}
      </h3>
      <ClusterPreview group={group} translateFeature={translateFeature} />
    </motion.section>
  );
}

const FEATURE_ORDERS: Record<
  ConstellationGroupKey,
  readonly ConstellationFeatureKey[]
> = {
  entrance: ["animatedEntrance", "music", "customDesign", "socialPreview"],
  story: ["countdown", "schedule", "coupleStory", "photoGallery", "dressCode"],
  guide: [
    "maps",
    "calendar",
    "giftRegistry",
    "guestGuide",
    "faqs",
    "languages",
  ],
  organize: [
    "personalizedRsvp",
    "partyResponses",
    "guestTracking",
    "dietaryNotes",
    "customAnswers",
    "whatsapp",
    "pdfExport",
  ],
};

function ClusterPreview({
  group,
  translateFeature,
}: {
  group: ConstellationGroup;
  translateFeature: (key: ConstellationFeatureKey) => string;
}) {
  return (
    <motion.ul
      variants={landingStaggerVariants}
      className="divide-y divide-border/65"
    >
      {FEATURE_ORDERS[group.key].map((feature) => {
        const Icon = FEATURE_ICONS[feature];

        return (
          <motion.li
            key={feature}
            variants={landingItemVariants}
            className="flex min-h-12 items-center gap-3 py-3 text-pretty text-xs leading-4 text-muted-foreground transition-[color,transform] duration-200 ease-out hover:translate-x-0.5 hover:text-foreground"
          >
            <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">{translateFeature(feature)}</span>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

function ConstellationSpine() {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-8 left-1/2 top-[32rem] w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,transparent,var(--border)_8%,var(--border)_92%,transparent)] lg:hidden"
    />
  );
}
