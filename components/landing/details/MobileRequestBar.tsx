"use client";

import { MessageCircle } from "lucide-react";

export function MobileRequestBar({
  whatsappHref,
  label,
}: {
  whatsappHref: string;
  label: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-background/92 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_40px_color-mix(in_srgb,var(--foreground)_10%,transparent)] backdrop-blur-xl lg:hidden">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="mx-auto flex min-h-10 max-w-lg items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-[transform,background-color] duration-200 hover:bg-foreground/90 active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {label}
      </a>
    </div>
  );
}
