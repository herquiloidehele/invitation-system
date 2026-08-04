import type { CSSProperties } from "react";

import type {
  CardSectionKey,
  CardStyle,
  CardStyleOverrides,
} from "@/lib/types";

export type CardStyleValue = CardStyle[keyof CardStyle];

export type CardSurfaceStyle = Partial<
  Pick<
    CSSProperties,
    | "background"
    | "border"
    | "borderTop"
    | "borderBottom"
    | "borderRadius"
    | "boxShadow"
    | "backdropFilter"
    | "WebkitBackdropFilter"
  >
>;

export function isPlainCardStyle(
  style?: Pick<CardStyle, "plain">,
): boolean {
  return style?.plain === true;
}

export function resolveCardSurfaceStyle(
  style: Pick<CardStyle, "plain"> | undefined,
  defaults: CardSurfaceStyle,
): CardSurfaceStyle {
  if (!isPlainCardStyle(style)) return defaults;

  return {
    ...defaults,
    background: "transparent",
    border: "none",
    ...(defaults.borderTop === undefined ? {} : { borderTop: "none" }),
    ...(defaults.borderBottom === undefined ? {} : { borderBottom: "none" }),
    borderRadius: 0,
    boxShadow: "none",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
  };
}

export function setCardStyleField(
  styles: CardStyleOverrides | undefined,
  section: CardSectionKey,
  field: keyof CardStyle,
  value: CardStyleValue,
): CardStyleOverrides | undefined {
  const nextStyles: CardStyleOverrides = { ...styles };
  const nextSection: CardStyle = {
    ...nextStyles[section],
    [field]: value,
  };

  if (value === undefined) delete nextSection[field];

  if (Object.keys(nextSection).length === 0) delete nextStyles[section];
  else nextStyles[section] = nextSection;

  return Object.keys(nextStyles).length === 0 ? undefined : nextStyles;
}
