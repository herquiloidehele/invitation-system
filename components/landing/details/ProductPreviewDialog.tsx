"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { PhoneIframePreview } from "@/components/landing/PhoneIframePreview";

export function ProductPreviewDialog({
  open,
  onOpenChange,
  title,
  previewHref,
  previewTitle,
  closeLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  previewHref: string;
  previewTitle: string;
  closeLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const backdropTransition = reduceMotion
    ? ""
    : "duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0";
  const popupTransition = reduceMotion
    ? ""
    : "duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={`fixed inset-0 z-50 bg-ink/70 backdrop-blur-md ${backdropTransition}`}
        />
        <DialogPrimitive.Popup
          className={`fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-visible outline-none ${popupTransition}`}
        >
          <DialogPrimitive.Title className="sr-only">
            {previewTitle}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="absolute -right-10 -top-10 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogPrimitive.Close>

          {open ? (
            <div className="flex flex-col items-center gap-6">
              <div className="w-full">
                <PhoneIframePreview
                  title={title}
                  src={previewHref}
                  iframeTitle={previewTitle}
                  showCaption={false}
                  loading="eager"
                />
              </div>
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
