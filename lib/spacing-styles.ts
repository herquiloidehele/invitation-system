import type { CSSProperties } from "react";
import type { SpacingStyleOverrides, SpacingValue } from "@/lib/types";

export type SpacingTarget = "sections" | "elements";
export type SpacingField = keyof SpacingValue;

export const SPACING_MIN = -80;
export const SPACING_MAX = 160;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampSpacing(value: number) {
  return Math.max(SPACING_MIN, Math.min(SPACING_MAX, value));
}

function sanitizeSpacingValue(value: unknown): SpacingValue | undefined {
  if (!isRecord(value)) return undefined;

  const next: SpacingValue = {};
  if (
    typeof value.spaceBefore === "number" &&
    Number.isFinite(value.spaceBefore)
  ) {
    next.spaceBefore = clampSpacing(value.spaceBefore);
  }
  if (
    typeof value.spaceAfter === "number" &&
    Number.isFinite(value.spaceAfter)
  ) {
    next.spaceAfter = clampSpacing(value.spaceAfter);
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

function sanitizeSpacingMap(
  value: unknown,
): Record<string, SpacingValue> | undefined {
  if (!isRecord(value)) return undefined;

  const next: Record<string, SpacingValue> = {};
  for (const [key, rawSpacing] of Object.entries(value)) {
    if (!key) continue;
    const spacing = sanitizeSpacingValue(rawSpacing);
    if (spacing) next[key] = spacing;
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

export function sanitizeSpacingStyles(
  input: unknown,
): SpacingStyleOverrides | null {
  if (!isRecord(input)) return null;

  const sections = sanitizeSpacingMap(input.sections);
  const elements = sanitizeSpacingMap(input.elements);
  if (!sections && !elements) return null;

  return {
    ...(sections && { sections }),
    ...(elements && { elements }),
  };
}

export function getSectionSpacing(
  spacingStyles: SpacingStyleOverrides | undefined | null,
  sectionKey: string,
) {
  return spacingStyles?.sections?.[sectionKey];
}

export function getElementSpacing(
  spacingStyles: SpacingStyleOverrides | undefined | null,
  elementKey: string,
) {
  return spacingStyles?.elements?.[elementKey];
}

export function spacingToStyle(
  value: SpacingValue | undefined,
): CSSProperties | undefined {
  if (!value) return undefined;
  const style: CSSProperties = {};
  if (value.spaceBefore !== undefined) style.marginTop = value.spaceBefore;
  if (value.spaceAfter !== undefined) style.marginBottom = value.spaceAfter;
  return Object.keys(style).length > 0 ? style : undefined;
}

export function setSpacingOverride(
  current: SpacingStyleOverrides | undefined,
  target: SpacingTarget,
  key: string,
  field: SpacingField,
  value: number | undefined,
): SpacingStyleOverrides | undefined {
  const nextTarget = { ...(current?.[target] ?? {}) };
  const nextValue: SpacingValue = { ...(nextTarget[key] ?? {}) };

  if (value === undefined || !Number.isFinite(value)) {
    delete nextValue[field];
  } else {
    nextValue[field] = clampSpacing(value);
  }

  if (Object.keys(nextValue).length > 0) {
    nextTarget[key] = nextValue;
  } else {
    delete nextTarget[key];
  }

  const next: SpacingStyleOverrides = {
    ...(current ?? {}),
    [target]: Object.keys(nextTarget).length > 0 ? nextTarget : undefined,
  };

  if (!next.sections) delete next.sections;
  if (!next.elements) delete next.elements;

  return next.sections || next.elements ? next : undefined;
}
