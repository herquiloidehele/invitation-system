"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ExternalLink, X } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { PhoneIframePreview } from "@/components/landing/PhoneIframePreview";

export function ProductPreviewDialog({
  open,
  onOpenChange,
  title,
  previewHref,
  previewTitle,
  closeLabel,
  openFullScreenLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  previewHref: string;
  previewTitle: string;
  closeLabel: string;
  openFullScreenLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const transitionClasses = reduceMotion
    ? ""
    : "duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={`fixed inset-0 z-50 bg-ink/70 backdrop-blur-md ${
            reduceMotion
              ? ""
              : "duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          }`}
        />
        <DialogPrimitive.Popup
          className={`fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2.5rem] bg-background p-4 shadow-[0_36px_100px_rgba(0,0,0,0.35)] outline-none sm:p-5 ${transitionClasses}`}
        >
          <DialogPrimitive.Title className="sr-only">
            {previewTitle}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="absolute right-3 top-3 z-30 inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-[transform,background-color] duration-200 hover:bg-muted active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogPrimitive.Close>

          {open ? (
            <PhoneIframePreview
              title={title}
              src={previewHref}
              iframeTitle={previewTitle}
              openLabel={openFullScreenLabel}
              showCaption={false}
              loading="eager"
            />
          ) : null}

          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-[transform,background-color] duration-200 hover:bg-foreground/90 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {openFullScreenLabel}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
