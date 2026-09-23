"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TextStyleOverrides } from "@/lib/types";

const TextStyleContext = createContext<TextStyleOverrides | undefined>(
  undefined,
);

/** Exposes the invitation's text overrides to `EditableText` on public pages. */
export function TextStyleProvider({
  children,
  textStyles,
}: {
  children: ReactNode;
  textStyles?: TextStyleOverrides;
}) {
  return (
    <TextStyleContext.Provider value={textStyles}>
      {children}
    </TextStyleContext.Provider>
  );
}

export function useTextStyles() {
  return useContext(TextStyleContext);
}
