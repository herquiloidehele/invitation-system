"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SpacingStyleOverrides } from "@/lib/types";

const SpacingStyleContext = createContext<SpacingStyleOverrides | undefined>(
  undefined,
);

export function SpacingStyleProvider({
  children,
  spacingStyles,
}: {
  children: ReactNode;
  spacingStyles?: SpacingStyleOverrides;
}) {
  return (
    <SpacingStyleContext.Provider value={spacingStyles}>
      {children}
    </SpacingStyleContext.Provider>
  );
}

export function useSpacingStyles() {
  return useContext(SpacingStyleContext);
}
