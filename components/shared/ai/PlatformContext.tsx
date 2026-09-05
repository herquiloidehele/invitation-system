"use client";

import { createContext, useContext } from "react";

import type { PlatformContextValue } from "@/lib/ai-platform-types";

const PlatformContext = createContext<PlatformContextValue | null>(null);

export const PlatformContextProvider = PlatformContext.Provider;

/**
 * Read the host-provided invitation + guest. Throws if a platform hook is
 * somehow called outside the provider — a clearer failure than a null deref
 * deep inside a generated bundle.
 */
export function usePlatformContext(): PlatformContextValue {
  const value = useContext(PlatformContext);
  if (!value) {
    throw new Error(
      "Platform hook used outside <PlatformProvider>. This is a host wiring bug, not a bundle bug.",
    );
  }
  return value;
}
