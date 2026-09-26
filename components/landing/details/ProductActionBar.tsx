"use client";

import { Eye, MessageCircle, PenLine } from "lucide-react";

export function ProductActionBar({
  whatsappHref,
  previewHref,
  customizeHref,
  requestLabel,
  previewLabel,
  customizeLabel,
}: {
  whatsappHref: string;
  previewHref: string;
  customizeHref: string;
  requestLabel: string;
  previewLabel: string;
  customizeLabel: string;
}) {
  return (
    <div className="sticky bottom-0 z-30 flex gap-2 border-t border-border/70 bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
      <a
        href={previewHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-background px-3 text-[13px] font-semibold text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-[transform,background-color] duration-200 hover:bg-surface-warm active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
        {previewLabel}
      </a>
      <a
        href={customizeHref}
        className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-[transform,background-color] duration-200 hover:bg-primary-hover active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <PenLine className="h-4 w-4 shrink-0" aria-hidden="true" />
        {customizeLabel}
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label={requestLabel}
        title={requestLabel}
        className="inline-flex size-[46px] shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-[transform,background-color] duration-200 hover:bg-foreground/90 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}
