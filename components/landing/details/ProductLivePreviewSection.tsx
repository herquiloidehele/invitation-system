"use client";

import { Maximize2 } from "lucide-react";

import { PhoneIframePreview } from "@/components/landing/PhoneIframePreview";

export const PRODUCT_LIVE_PREVIEW_ID = "preview-ao-vivo";

export function ProductLivePreviewSection({
  title,
  previewHref,
  previewTitle,
  sectionTitle,
  sectionBody,
  expandLabel,
  onExpand,
}: {
  title: string;
  previewHref: string;
  previewTitle: string;
  sectionTitle: string;
  sectionBody: string;
  expandLabel: string;
  onExpand: () => void;
}) {
  return (
    <section
      id={PRODUCT_LIVE_PREVIEW_ID}
      className="hidden scroll-mt-20 bg-surface-warm py-14 lg:block"
    >
      <div className="mx-auto max-w-[94rem] px-10">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-[1.75rem] font-medium leading-[1.15] tracking-[-0.025em] text-foreground">
            {sectionTitle}
          </h2>
          <p className="mt-3 text-[15px] leading-[1.65] text-muted-foreground [text-wrap:pretty]">
            {sectionBody}
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-5">
          {/* Explicit width: PhoneIframePreview sizes itself with `w-full
              max-w-88`, which collapses to zero inside an `items-center`
              flex column unless the wrapper establishes a width. */}
          <div className="w-88">
            <PhoneIframePreview
              title={title}
              src={previewHref}
              iframeTitle={previewTitle}
              showCaption={false}
              loading="lazy"
            />
          </div>
          <button
            type="button"
            onClick={onExpand}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-background px-5 text-[13px] font-semibold text-foreground shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--foreground)_16%,transparent)] transition-[transform,box-shadow] duration-200 hover:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--foreground)_35%,transparent)] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
            {expandLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
