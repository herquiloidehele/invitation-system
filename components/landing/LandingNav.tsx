"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import logo from "@/design/logo.jpg";
import {
  getMotionProps,
  landingItemVariants,
  landingNavVariants,
  landingStaggerVariants,
  shouldReduceMotion,
} from "./landing-motion";
import { getNavLinks } from "./landing-data";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { type Currency } from "@/lib/currency/config";

export function LandingNav({ currentCurrency }: { currentCurrency: Currency }) {
  const reduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion(reduceMotion);
  const t = useTranslations("Landing");
  const navT = useTranslations("LandingNav");
  const navLinks = [...getNavLinks(navT)];

  return (
    <motion.header
      {...getMotionProps(reduceMotion, landingNavVariants, "animate")}
      className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl"
    >
      <motion.nav
        variants={landingStaggerVariants}
        className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8"
      >
        <motion.a
          variants={landingItemVariants}
          href="#top"
          aria-label={t("navAriaLabel")}
          className="flex items-center gap-3 rounded-full font-semibold tracking-[-0.03em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
        >
          <Image
            src={logo}
            alt=""
            width={44}
            height={44}
            priority
            className="rounded-full border border-border shadow-[0_8px_24px_color-mix(in_srgb,var(--foreground)_8%,transparent)]"
          />
          <span className="text-xl">brindeal</span>
        </motion.a>
        <motion.div
          variants={landingStaggerVariants}
          className="hidden items-center gap-8 lg:flex"
        >
          {navLinks.map((link) => (
            <motion.a
              key={link.href}
              variants={landingItemVariants}
              whileHover={reduced ? undefined : { y: -1 }}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
            >
              {link.label}
            </motion.a>
          ))}
        </motion.div>
        <motion.div
          variants={landingItemVariants}
          className="flex items-center gap-2"
        >
          <CurrencySwitcher current={currentCurrency} />
          <LocaleSwitcher />
        </motion.div>
      </motion.nav>
    </motion.header>
  );
}
