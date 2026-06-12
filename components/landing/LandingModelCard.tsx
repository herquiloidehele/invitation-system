"use client";

import Image from "next/image";
import { motion, type HTMLMotionProps } from "framer-motion";
import { MousePointerClickIcon } from "lucide-react";
import type { LandingPrice } from "@/lib/landing-features";
import { buildPurchaseMessage, buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { ExpandableDescription } from "./ExpandableDescription";
import {
  getLandingModelCardVariantConfig,
  type LandingModelCardVariant,
} from "./landing-model-card-config";

export type LandingModelCardItem = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  description: string | null;
  price: LandingPrice | null;
};

type LandingModelCardLabels = {
  fallbackTitle: string;
  previewAria: string;
  clickToPreview: string;
  showMore: string;
  showLess: string;
  buyCta: string;
};

export function LandingModelCard({
  item,
  variant,
  labels,
  onPreviewClick,
  badgeLabel,
  motionProps,
}: {
  item: LandingModelCardItem;
  variant: LandingModelCardVariant;
  labels: LandingModelCardLabels;
  onPreviewClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  badgeLabel?: string;
  motionProps?: HTMLMotionProps<"article">;
}) {
  const config = getLandingModelCardVariantConfig(variant);
  const title = item.title || labels.fallbackTitle;
  const previewLabel = `${labels.previewAria}: ${title}`;
  const whatsappHref = buildWhatsappUrl(
    buildPurchaseMessage(title, labels.fallbackTitle),
  );

  return (
    <motion.article
      {...motionProps}
      className={`group flex h-full flex-col overflow-hidden rounded-[1.5rem] transition ${config.cardClassName}`}
    >
      <a
        href={item.href}
        rel="noreferrer"
        aria-label={previewLabel}
        onClick={onPreviewClick}
        className="flex flex-1 cursor-pointer flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      >
        <div className="relative h-72 overflow-hidden bg-[linear-gradient(135deg,var(--border),var(--primary-soft))]">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={title}
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,color-mix(in_srgb,var(--foreground)_16%,transparent))]" />
          <div className="pointer-events-none absolute bottom-3 sm:top-3 right-3 z-10 md:opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block">
            <div className="flex items-center gap-2 rounded-full bg-background/90 py-2 pr-4 pl-3 shadow-lg backdrop-blur-sm">
              <MousePointerClickIcon className="h-4 w-4 text-foreground" />
              <span className="text-xs font-medium text-foreground">
                {labels.clickToPreview}
              </span>
            </div>
          </div>
          {badgeLabel ? (
            <span
              className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${config.badgeClassName}`}
            >
              {badgeLabel}
            </span>
          ) : null}
        </div>
        <div className={config.bodyClassName}>
          <h3 className={config.titleClassName}>{title}</h3>
          {item.description ? (
            <ExpandableDescription
              text={item.description}
              className={config.descriptionClassName}
              toggleClassName={config.toggleClassName}
              moreLabel={labels.showMore}
              lessLabel={labels.showLess}
            />
          ) : null}
        </div>
      </a>
      <div
        className={`flex items-center justify-between gap-3 ${config.footerClassName}`}
      >
        {item.price ? (
          <a
            href={item.href}
            rel="noreferrer"
            aria-label={previewLabel}
            onClick={onPreviewClick}
            className="flex min-w-0 flex-wrap items-baseline gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {item.price.originalLabel ? (
              <span
                className={`text-xs line-through ${config.priceOriginalClassName}`}
              >
                {item.price.originalLabel}
              </span>
            ) : null}
            <span className="flex items-baseline gap-1.5">
              <span className={`text-xs ${config.pricePrefixClassName}`}>
                {item.price.prefix}
              </span>
              <span
                className={`text-base font-semibold ${config.priceAmountClassName}`}
              >
                {item.price.amount}
              </span>
            </span>
          </a>
        ) : (
          <span />
        )}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`${labels.buyCta}: ${title}`}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${config.buyButtonClassName}`}
        >
          {labels.buyCta}
        </a>
      </div>
    </motion.article>
  );
}
