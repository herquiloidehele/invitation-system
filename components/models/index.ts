import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ModelComponentProps } from "./types";
import type { InvitationStyles } from "@/lib/types";

import { DEFAULT_STYLES as ClassicFloralDefaults } from "./ClassicFloral/defaults";
import { DEFAULT_STYLES as ModernMinimalDefaults } from "./ModernMinimal/defaults";
import { DEFAULT_STYLES as BohoNaturalDefaults } from "./BohoNatural/defaults";
import { DEFAULT_STYLES as MidnightLuxeDefaults } from "./MidnightLuxe/defaults";

/**
 * Registry of model components, keyed by the `component` field from the Model database record.
 * Each entry is lazily loaded via `next/dynamic` so only the selected model's code is bundled.
 */
export const MODEL_COMPONENTS: Record<
  string,
  ComponentType<ModelComponentProps>
> = {
  ClassicFloral: dynamic(() => import("./ClassicFloral/ClassicFloral")),
  ModernMinimal: dynamic(() => import("./ModernMinimal/ModernMinimal")),
  BohoNatural: dynamic(() => import("./BohoNatural/BohoNatural")),
  MidnightLuxe: dynamic(() => import("./MidnightLuxe/MidnightLuxe")),
};

/**
 * Default visual styles for each model component.
 * Used as the initial styles when creating an invitation with a given model.
 * Keyed by the same component name used in MODEL_COMPONENTS.
 */
export const MODEL_DEFAULT_STYLES: Record<string, InvitationStyles> = {
  ClassicFloral: ClassicFloralDefaults,
  ModernMinimal: ModernMinimalDefaults,
  BohoNatural: BohoNaturalDefaults,
  MidnightLuxe: MidnightLuxeDefaults,
};

/**
 * Get a model component by name. Returns undefined if not found.
 */
export function getModelComponent(
  componentName: string,
): ComponentType<ModelComponentProps> | undefined {
  return MODEL_COMPONENTS[componentName];
}

/**
 * Get the default styles for a model component. Falls back to ClassicFloral if not found.
 */
export function getDefaultStylesForComponent(
  componentName: string,
): InvitationStyles {
  return MODEL_DEFAULT_STYLES[componentName] ?? ClassicFloralDefaults;
}
