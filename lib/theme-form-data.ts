import type { ModelRecord } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Form data for editing a model's metadata (identity only — styles are on the invitation). */
export interface ModelFormData {
  name: string;
  label: string;
  description: string;
  component: string;
  previewImage: string;
}

/**
 * @deprecated Use `ModelFormData` instead.
 */
export type ThemeFormData = ModelFormData;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function modelToFormData(model: ModelRecord): ModelFormData {
  return {
    name: model.name,
    label: model.label,
    description: model.description,
    component: model.component,
    previewImage: model.previewImage ?? "",
  };
}

/** @deprecated Use `modelToFormData` instead. */
export function themeToFormData(model: ModelRecord): ModelFormData {
  return modelToFormData(model);
}

export const EMPTY_FORM_DATA: ModelFormData = {
  name: "",
  label: "",
  description: "",
  component: "ModernMinimal",
  previewImage: "",
};
