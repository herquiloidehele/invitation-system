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
    <aside className="lg:sticky lg:top-20 lg:self-start lg:px-5 xl:px-10">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--brindel-brown)]">
        {eyebrow}
      </p>

      <h1 className="mt-3 max-w-xl text-[1.75rem] font-medium leading-[1.15] tracking-[-0.025em] text-foreground [text-wrap:balance] sm:text-[2.125rem] lg:text-[2.75rem]">
        {details.title}
      </h1>

      {details.price ? (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 tabular-nums">
          <span className="text-[13px] text-muted-foreground">
            {details.price.prefix}
          </span>
          <span className="text-xl font-semibold tracking-[-0.03em] text-foreground lg:text-[1.375rem]">
            {details.price.amount}
          </span>
          {details.price.originalLabel ? (
            <s className="text-[13px] text-faint-foreground">
              {details.price.originalLabel}
            </s>
          ) : null}
        </div>
      ) : null}

      {details.description ? (
        <p className="mt-5 max-w-lg text-[15px] leading-[1.65] text-muted-foreground [text-wrap:pretty] lg:text-base lg:leading-[1.7]">
          {details.description}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-surface-warm px-3 py-2 text-[11px] font-medium text-foreground/80 shadow-[inset_0_0_0_1px_var(--brindel-border-light)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-7 hidden gap-3 lg:grid">
        <a
          href={details.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[13px] font-semibold text-background shadow-[0_14px_34px_color-mix(in_srgb,var(--foreground)_18%,transparent)] transition-[transform,background-color] duration-200 hover:bg-foreground/90 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {requestLabel}
        </a>
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[13px] font-semibold text-primary-foreground shadow-[0_14px_34px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-[transform,background-color] duration-200 hover:bg-primary-hover active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          {previewLabel}
        </button>
      </div>

      <ProductDetailsAccordions items={accordionItems} />
    </aside>
  );
}
