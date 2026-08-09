"use client";

import { Eye, MessageCircle } from "lucide-react";

import { ProductDetailsAccordions } from "./ProductDetailsAccordions";
import type { LandingProductDetails } from "@/lib/landing-product-details-data";

export function ProductDetailsPanel({
  details,
  eyebrow,
  tags,
  accordionItems,
  requestLabel,
  previewLabel,
  onPreview,
}: {
  details: LandingProductDetails;
  eyebrow: string;
  tags: string[];
  accordionItems: Array<{ title: string; body: string }>;
  requestLabel: string;
  previewLabel: string;
  onPreview: () => void;
}) {
  return (
    <aside className="lg:sticky lg:top-8 lg:self-start lg:px-5 lg:py-6 xl:px-10">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-xl font-[var(--font-cormorant-garamond)] text-5xl font-light leading-[0.92] tracking-[-0.045em] text-foreground [text-wrap:balance] sm:text-6xl lg:text-7xl">
        {details.title}
      </h1>
      {details.subtitle ? (
        <p className="mt-4 font-[var(--font-cormorant-garamond)] text-xl italic text-muted-foreground">
          {details.subtitle}
        </p>
      ) : null}

      {details.price ? (
        <div className="mt-5 flex items-baseline gap-3 tabular-nums">
          {details.price.originalLabel ? (
            <span className="text-sm text-muted-foreground/70 line-through">
              {details.price.originalLabel}
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {details.price.prefix}
          </span>
          <span className="text-xl font-semibold tracking-[-0.03em] text-foreground">
            {details.price.amount}
          </span>
        </div>
      ) : null}

      {details.description ? (
        <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground [text-wrap:pretty]">
          {details.description}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-3 py-2 text-xs font-medium text-foreground/80 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--foreground)_5%,transparent)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-3">
        <a
          href={details.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="hidden min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background shadow-[0_14px_34px_color-mix(in_srgb,var(--foreground)_18%,transparent)] transition-[transform,background-color] duration-200 hover:bg-foreground/90 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:flex"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {requestLabel}
        </a>
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-background px-6 text-sm font-semibold text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--foreground)_16%,transparent)] transition-[transform,box-shadow] duration-200 hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--foreground)_35%,transparent)] active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          {previewLabel}
        </button>
      </div>

      <ProductDetailsAccordions items={accordionItems} />
    </aside>
  );
}
