"use client";

import { useTranslations } from "next-intl";
import { WhatsAppIcon } from "@/components/shared/icons/WhatsAppIcon";
import type { Currency } from "@/lib/currency/config";
import { getCustomInvitationPrice } from "@/lib/custom-invitation";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import { SectionEyebrow } from "./SectionEyebrow";

export function CustomInvitationSection({
  currentCurrency,
}: {
  currentCurrency: Currency;
}) {
  const t = useTranslations("LandingCustomInvitation");
  const price = getCustomInvitationPrice(currentCurrency);
  const whatsappHref = buildWhatsappUrl(t("whatsappMessage"));

  return (
    <AnimatedSection className="bg-background px-5 pb-12 antialiased sm:px-8 lg:pb-16">
      <div className="mx-auto max-w-7xl rounded-[1.5rem] bg-primary-soft px-6 py-12 sm:px-10 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)_auto] lg:items-center lg:gap-8 lg:px-12 lg:py-14">
        <div className="text-center lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-balance text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-7 text-muted-foreground lg:mx-0">
            {t("body")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 border-y border-primary/15 py-6 text-center lg:mt-0 lg:border-x lg:border-y-0 lg:px-8 lg:py-2">
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">
              {price}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("priceLabel")}
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">
              {t("timelineValue")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("timelineLabel")}
            </p>
          </div>
        </div>

        <div className="mt-8 lg:mt-0">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label={t("ctaAria")}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_9px_24px_color-mix(in_srgb,var(--primary)_22%,transparent)] transition-[background-color,box-shadow,transform] hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 active:scale-[0.96] motion-reduce:transition-none lg:w-auto"
          >
            <WhatsAppIcon className="size-4" aria-hidden="true" />
            {t("cta")}
          </a>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t("ctaNote")}
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
