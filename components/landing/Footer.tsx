"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  getMotionProps,
  landingItemVariants,
  landingStaggerVariants,
} from "./landing-motion";

export function Footer() {
  const t = useTranslations("LandingFooter");
  const reduceMotion = useReducedMotion();
  const linkGroups = [
    {
      heading: t("product"),
      links: [
        { label: t("baptism"), href: "#galeria" },
        { label: t("engagement"), href: "#galeria" },
      ],
    },
    {
      heading: t("resources"),
      links: [
        { label: t("gallery"), href: "#galeria" },
        { label: t("process"), href: "#processo" },
        { label: t("faq"), href: "#faq" },
      ],
    },
    {
      heading: t("company"),
      links: [
        { label: t("about"), href: "#recursos" },
        { label: t("contact"), href: "#orcamento" },
      ],
    },
  ];

  return (
    <motion.footer
      {...getMotionProps(reduceMotion, landingStaggerVariants)}
      className="bg-foreground px-5 py-16 text-primary-soft sm:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <motion.div variants={landingItemVariants}>
          <div className="flex items-center gap-2 text-xl font-semibold text-primary-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-soft" />
            Brindeal Studio
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-faint-foreground">
            {t("description")}
          </p>
        </motion.div>
        {linkGroups.map(({ heading, links }) => (
          <motion.div
            key={heading}
            variants={landingItemVariants}
            className="space-y-3 text-sm"
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-foreground">
              {heading}
            </p>
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-faint-foreground transition hover:text-primary-foreground"
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        ))}
      </div>
      <motion.div
        variants={landingItemVariants}
        className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-primary-foreground/10 pt-8 text-xs text-faint-foreground sm:flex-row"
      >
        <p>{t("copyright")}</p>
        <p>{t("languages")}</p>
      </motion.div>
    </motion.footer>
  );
}
