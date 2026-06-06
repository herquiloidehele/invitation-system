"use client";

import { FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  type ContactMessageFields,
  DISPLAY_WHATSAPP_NUMBER,
} from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import {
  getMotionProps,
  landingCardTap,
  landingCardVariants,
  landingItemVariants,
  landingStaggerVariants,
  shouldReduceMotion,
} from "./landing-motion";
import { SectionEyebrow } from "./SectionEyebrow";

export function ContactSection({
  formState,
  onFieldChange,
  onSubmit,
}: {
  formState: ContactMessageFields;
  onFieldChange: (field: keyof ContactMessageFields, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const t = useTranslations("LandingContact");
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);

  return (
    <AnimatedSection id="orcamento" className="bg-muted px-5 py-24 sm:px-8">
      <motion.div
        {...getMotionProps(reduceMotion, landingStaggerVariants)}
        className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"
      >
        <motion.div variants={landingItemVariants}>
          <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          <h2 className="mt-6 text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-foreground sm:text-5xl">
            {t("titleLine1")}
            <span className="block text-primary">{t("titleLine2")}</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            {t("body")}
          </p>
          <div className="mt-8 space-y-3 text-sm text-primary">
            <p>WhatsApp · {DISPLAY_WHATSAPP_NUMBER}</p>
            <p>E-mail · ola@convites.brindealstudio.com</p>
          </div>
        </motion.div>
        <motion.form
          variants={landingCardVariants}
          onSubmit={onSubmit}
          className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm sm:p-9"
        >
          <h3 className="text-2xl font-semibold">{t("formTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("formSubtitle")}</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <TextField
              label={t("name")}
              placeholder={t("namePlaceholder")}
              value={formState.name}
              onChange={(value) => onFieldChange("name", value)}
            />
            <TextField
              label={t("eventType")}
              placeholder={t("eventTypePlaceholder")}
              value={formState.eventType}
              onChange={(value) => onFieldChange("eventType", value)}
            />
          </div>
          <label className="mt-4 block text-sm font-semibold text-foreground">
            {t("message")}
            <textarea
              value={formState.message}
              onChange={(event) => onFieldChange("message", event.target.value)}
              className="mt-2 min-h-28 w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={t("messagePlaceholder")}
            />
          </label>
          <motion.button
            type="submit"
            whileHover={reduced ? undefined : { y: -2 }}
            whileTap={reduced ? undefined : landingCardTap}
            className="mt-6 w-full rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
          >
            {t("submit")}
          </motion.button>
        </motion.form>
      </motion.div>
    </AnimatedSection>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-foreground">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-border bg-muted px-4 text-sm font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
