"use client";

import { type ReactNode, useLayoutEffect } from "react";

import type { InvitationData, PublicGuestData } from "@/lib/types";
import { PlatformContextProvider } from "./PlatformContext";
import { platformHolder } from "./buildPlatformApi";

/**
 * Supplies the invitation + guest to the platform hooks. Rendered by the host
 * around AiBundleMount, so a bundle calling `useGifts()` (host code invoked
 * inside the shared React tree) reads this context.
 */
export default function PlatformProvider({
  invitation,
  guest,
  children,
}: {
  invitation: InvitationData;
  guest: PublicGuestData | null;
  children: ReactNode;
}) {
  // Populate the per-request holder that @platform's value getters read. A
  // layout effect (not a render-body mutation) keeps render side-effect-free;
  // it flushes before AiBundleMount's passive effect injects the async bundle
  // script, so the holder is set before the bundle evaluates.
  useLayoutEffect(() => {
    platformHolder.invitation = invitation;
    platformHolder.guest = guest;
  }, [invitation, guest]);

  return (
    <PlatformContextProvider value={{ invitation, guest }}>
      {children}
    </PlatformContextProvider>
  );
}
