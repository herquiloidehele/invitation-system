import { resolveRsvpInputColors } from "./rsvp-input-colors";
import { isRsvpInputStyle, type RsvpInputStyle } from "./rsvp-input-styles";
import type {
  InvitationData,
  RsvpPageBase,
  RsvpPageColorKey,
  RsvpPageLayout,
  RsvpPageRadius,
  RsvpPageShadow,
  RsvpPageStyle,
  TemplateTheme,
} from "./types";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const RSVP_PAGE_COLOR_KEYS: readonly RsvpPageColorKey[] = [
  "pageBg",
  "cardBg",
  "border",
  "title",
  "text",
  "muted",
  "accent",
  "buttonBg",
  "buttonText",
];

const BASES: readonly RsvpPageBase[] = ["neutral", "theme"];
const LAYOUTS: readonly RsvpPageLayout[] = ["classic", "minimal", "editorial"];
const RADII: readonly RsvpPageRadius[] = ["square", "soft", "round"];
const SHADOWS: readonly RsvpPageShadow[] = ["none", "soft", "strong"];
const HEADER_FLAGS = ["showEyebrow", "showDate", "showMonogram"] as const;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** The theme fields the page reads. */
export type RsvpPageThemeSource = Pick<
  TemplateTheme,
  | "bg"
  | "cardBg"
  | "cardBorder"
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "accent"
  | "ctaPrimaryBg"
  | "ctaPrimaryText"
  | "ctaRadius"
  | "displayFont"
  | "uiFont"
>;

/** The shared `rsvp` settings (also used by the in-invitation form). */
export type RsvpPageFieldSource = Partial<
  Pick<
    InvitationData["rsvp"],
    | "inputStyle"
    | "inputBackgroundColor"
    | "inputTextColor"
    | "inputPlaceholderColor"
    | "inputBorderColor"
    | "backgroundImageUrl"
  >
>;

export type RsvpPageColors = Record<
  RsvpPageColorKey | "fieldBg" | "fieldText" | "fieldPlaceholder" | "fieldBorder",
  string
>;

export interface RsvpPageTokens {
  layout: RsvpPageLayout;
  colors: RsvpPageColors;
  fonts: { title: string; body: string };
  radius: {
    card: string;
    button: string;
    /**
     * Set only by an explicit shape preset. When present it overrides the
     * field style's own radii and pins the button radius for every style.
     */
    field?: string;
  };
  cardBorder: boolean;
  shadow: string;
  fieldStyle: RsvpInputStyle;
  hasCustomFieldBackground: boolean;
  header: {
    showEyebrow: boolean;
    showDate: boolean;
    showMonogram: boolean;
    imageUrl?: string;
  };
  backgroundImageUrl?: string;
}

interface RsvpPageBaseTokens {
  colors: Record<RsvpPageColorKey, string>;
  fonts: { title: string; body: string };
  radius: { card: string; button: string };
}

/** Today's hardcoded page — the look every legacy invitation keeps. */
const NEUTRAL_BASE: RsvpPageBaseTokens = {
  colors: {
    pageBg: "#F9F8F6",
    cardBg: "#FFFFFF",
    border: "#E6E4E0",
    title: "#2C2C2B",
    text: "#6B6A68",
    muted: "#A5A39F",
    accent: "#BE8C7A",
    buttonBg: "#2C2C2B",
    buttonText: "#FFFFFF",
  },
  fonts: {
    title: "'Georgia', 'Times New Roman', serif",
    body: "'Inter', system-ui, sans-serif",
  },
  radius: { card: "16px", button: "10px" },
};
const NEUTRAL_FIELD_BG = "#F4F3F0";

const RADIUS_PRESETS: Record<
  RsvpPageRadius,
  { card: string; field: string; button: string }
> = {
  square: { card: "0px", field: "0px", button: "0px" },
  soft: { card: "12px", field: "8px", button: "8px" },
  round: { card: "24px", field: "16px", button: "999px" },
};

const SHADOW_PRESETS: Record<RsvpPageShadow, string> = {
  none: "none",
  soft: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  strong: "0 18px 40px -12px rgb(0 0 0 / 0.18)",
};

// ---------------------------------------------------------------------------
// Sanitizer
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(
  options: readonly T[],
  value: unknown,
): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function isRsvpPageHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/**
 * Normalizes stored/posted JSON into a valid RsvpPageStyle, dropping anything
 * unknown or malformed. Returns undefined when there is no valid `base`.
 */
export function sanitizeRsvpPageStyle(raw: unknown): RsvpPageStyle | undefined {
  if (!isRecord(raw) || !isOneOf(BASES, raw.base)) return undefined;
  const style: RsvpPageStyle = { base: raw.base };

  if (isOneOf(LAYOUTS, raw.layout)) style.layout = raw.layout;

  if (isRecord(raw.colors)) {
    const colors: Partial<Record<RsvpPageColorKey, string>> = {};
    for (const key of RSVP_PAGE_COLOR_KEYS) {
      const value = raw.colors[key];
      if (isRsvpPageHexColor(value)) colors[key] = value;
    }
    if (Object.keys(colors).length > 0) style.colors = colors;
  }

  if (isRecord(raw.fonts)) {
    const title = nonEmptyString(raw.fonts.title);
    const body = nonEmptyString(raw.fonts.body);
    if (title || body) {
      style.fonts = { ...(title && { title }), ...(body && { body }) };
    }
  }

  if (isRecord(raw.shape)) {
    const shape: NonNullable<RsvpPageStyle["shape"]> = {};
    if (isOneOf(RADII, raw.shape.radius)) shape.radius = raw.shape.radius;
    if (typeof raw.shape.border === "boolean") shape.border = raw.shape.border;
    if (isOneOf(SHADOWS, raw.shape.shadow)) shape.shadow = raw.shape.shadow;
    if (Object.keys(shape).length > 0) style.shape = shape;
  }

  if (isRecord(raw.header)) {
    const header: NonNullable<RsvpPageStyle["header"]> = {};
    for (const flag of HEADER_FLAGS) {
      const value = raw.header[flag];
      if (typeof value === "boolean") header[flag] = value;
    }
    const imageUrl = nonEmptyString(raw.header.imageUrl);
    if (imageUrl) header.imageUrl = imageUrl;
    if (Object.keys(header).length > 0) style.header = header;
  }

  return style;
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

function themeBase(theme: RsvpPageThemeSource): RsvpPageBaseTokens {
  return {
    colors: {
      pageBg: theme.bg,
      cardBg: theme.cardBg,
      border: theme.cardBorder,
      title: theme.textPrimary,
      text: theme.textSecondary,
      muted: theme.textMuted,
      // resolveRsvpInputStyle appends hex alpha suffixes to the accent.
      accent: isRsvpPageHexColor(theme.accent)
        ? theme.accent
        : NEUTRAL_BASE.colors.accent,
      buttonBg: theme.ctaPrimaryBg,
      buttonText: theme.ctaPrimaryText,
    },
    fonts: { title: theme.displayFont, body: theme.uiFont },
    radius: { card: NEUTRAL_BASE.radius.card, button: theme.ctaRadius },
  };
}

/**
 * Turns the stored config into render-ready tokens. Per token the first hit
 * wins: explicit override → (field tokens only) shared `rsvp.input*` → base.
 * A missing config resolves exactly like `{ base: "neutral" }`.
 */
export function resolveRsvpPageStyle({
  config,
  theme,
  rsvp,
}: {
  config: unknown;
  theme?: RsvpPageThemeSource | null;
  rsvp?: RsvpPageFieldSource | null;
}): RsvpPageTokens {
  const style = sanitizeRsvpPageStyle(config);
  const useTheme = style?.base === "theme" && theme != null;
  const base = useTheme ? themeBase(theme) : NEUTRAL_BASE;
  const overrides = style?.colors ?? {};
  const page = { ...base.colors, ...overrides };

  const derivedFieldBg =
    !useTheme && !overrides.cardBg && !overrides.title
      ? NEUTRAL_FIELD_BG
      : `color-mix(in srgb, ${page.title} 5%, ${page.cardBg})`;
  const field = resolveRsvpInputColors(rsvp, {
    backgroundColor: derivedFieldBg,
    textColor: page.title,
    placeholderColor: page.muted,
    borderColor: page.border,
  });

  const layout = style?.layout ?? "classic";
  const preset = style?.shape?.radius
    ? RADIUS_PRESETS[style.shape.radius]
    : undefined;
  const header = style?.header ?? {};
  const backgroundImageUrl = nonEmptyString(rsvp?.backgroundImageUrl);

  return {
    layout,
    colors: {
      ...page,
      fieldBg: field.backgroundColor,
      fieldText: field.textColor,
      fieldPlaceholder: field.placeholderColor,
      fieldBorder: field.borderColor,
    },
    fonts: {
      title: style?.fonts?.title ?? base.fonts.title,
      body: style?.fonts?.body ?? base.fonts.body,
    },
    radius: preset ?? { ...base.radius },
    cardBorder: style?.shape?.border ?? true,
    shadow: SHADOW_PRESETS[style?.shape?.shadow ?? "soft"],
    fieldStyle: isRsvpInputStyle(rsvp?.inputStyle) ? rsvp.inputStyle : "default",
    hasCustomFieldBackground: Boolean(rsvp?.inputBackgroundColor?.trim()),
    header: {
      showEyebrow: header.showEyebrow ?? true,
      showDate: header.showDate ?? true,
      showMonogram: header.showMonogram ?? layout === "editorial",
      ...(header.imageUrl && { imageUrl: header.imageUrl }),
    },
    ...(backgroundImageUrl && { backgroundImageUrl }),
  };
}
