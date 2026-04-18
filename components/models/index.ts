import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type {
  ModelComponentProps,
  ModelRegistration,
  ModelStyleEditorProps,
} from "./types";
import type { InvitationStyles } from "@/lib/types";

import { DEFAULT_STYLES as ModernMinimalDefaults } from "./ModernMinimal/defaults";
import { modernMinimalStylesSchema } from "./ModernMinimal/schema";

// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------

/**
 * Registry of all available models.
 * Each entry bundles the renderer, default styles, validation schema,
 * and admin style editor for that model.
 *
 * To add a new model:
 * 1. Create a folder under components/models/<Name>/
 * 2. Add index.tsx (renderer), defaults.ts, types.ts, schema.ts, StyleEditor.tsx
 * 3. Register it here with all four exports
 */
export const MODEL_REGISTRY: Record<string, ModelRegistration> = {
  ModernMinimal: {
    component: dynamic(() => import("./ModernMinimal/ModernMinimal")),
    defaultStyles: ModernMinimalDefaults as unknown as Record<string, unknown>,
    styleSchema: modernMinimalStylesSchema,
    StyleEditor: dynamic(
      () => import("./ModernMinimal/StyleEditor"),
    ) as unknown as ComponentType<ModelStyleEditorProps>,
  },
};

// ---------------------------------------------------------------------------
// Legacy compatibility maps (used by existing code)
// ---------------------------------------------------------------------------

/**
 * @deprecated Use MODEL_REGISTRY[name].component instead.
 * Kept for backward compatibility with code that imports MODEL_COMPONENTS.
 */
export const MODEL_COMPONENTS: Record<
  string,
  ComponentType<ModelComponentProps>
> = Object.fromEntries(
  Object.entries(MODEL_REGISTRY).map(([k, v]) => [k, v.component]),
);

/**
 * @deprecated Use MODEL_REGISTRY[name].defaultStyles instead.
 * Kept for backward compatibility with code that imports MODEL_DEFAULT_STYLES.
 */
export const MODEL_DEFAULT_STYLES: Record<string, InvitationStyles> =
  Object.fromEntries(
    Object.entries(MODEL_REGISTRY).map(([k, v]) => [
      k,
      v.defaultStyles as unknown as InvitationStyles,
    ]),
  );

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a model component by name. Returns undefined if not found. */
export function getModelComponent(
  componentName: string,
): ComponentType<ModelComponentProps> | undefined {
  return MODEL_REGISTRY[componentName]?.component;
}

/** Get the default styles for a model component. Falls back to ModernMinimal if not found. */
export function getDefaultStylesForComponent(
  componentName: string,
): InvitationStyles {
  return (
    (MODEL_REGISTRY[componentName]?.defaultStyles as unknown as InvitationStyles) ??
    (ModernMinimalDefaults as unknown as InvitationStyles)
  );
}

/** Get the full model registration entry. Returns undefined if not found. */
export function getModelRegistration(
  componentName: string,
): ModelRegistration | undefined {
  return MODEL_REGISTRY[componentName];
}

/** Get the style editor component for a model. Returns undefined if not found. */
export function getModelStyleEditor(
  componentName: string,
): ComponentType<ModelStyleEditorProps> | undefined {
  return MODEL_REGISTRY[componentName]?.StyleEditor;
}
