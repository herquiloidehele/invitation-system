"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { SpacingStyleOverrides, TextStyleOverrides } from "@/lib/types";
import { TextStyleProvider } from "./TextStyleProvider";

const SpacingStyleContext = createContext<SpacingStyleOverrides | undefined>(
  undefined,
);

export function SpacingStyleProvider({
  children,
  spacingStyles,
  textStyles,
}: {
  children: ReactNode;
  spacingStyles?: SpacingStyleOverrides;
  textStyles?: TextStyleOverrides;
}) {
  return (
    <SpacingStyleContext.Provider value={spacingStyles}>
      <TextStyleProvider textStyles={textStyles}>{children}</TextStyleProvider>
    </SpacingStyleContext.Provider>
  );
}

export function useSpacingStyles() {
  return useContext(SpacingStyleContext);
}
