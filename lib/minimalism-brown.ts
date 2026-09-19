import type { CSSProperties } from "react";
import type {
  CardSectionKey,
  CardStyleOverrides,
  GuestbookConfig,
  TemplateTheme,
  TextStyleOverrides,
} from "./types";
import { applyOverride } from "./text-styles";

/**
 * Returns true when the theme should render via the MinimalismBrownPage
 * pipeline. Like elegant-floral, the layout still flows through the themed
 * envelope cover; only the post-envelope content is swapped (see
 * InvitationView.renderContent).
 */
export function isMinimalismBrownLayout(
  theme: Pick<TemplateTheme, "layout"> | { layout?: string | null },
): boolean {
  return theme.layout === "minimalism-brown";
}

/**
 * A themed color faded toward transparency. Hairline rules and low-contrast
 * fills go through this rather than hard-coded rgba() so they track whatever
 * palette the admin sets.
 */
export function mixWithTransparent(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

// ---------------------------------------------------------------------------
// Contrast
// ---------------------------------------------------------------------------

/** Parse #rgb / #rrggbb / rgb() / rgba() into 0-255 channels. Null when the
 *  value isn't a form we can reason about (a gradient, a CSS variable). */
export function parseColor(
  value: string | null | undefined,
): [number, number, number] | null {
  if (!value) return null;
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }
  const rgb = v.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(",").map((p) => parseFloat(p));
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return [parts[0], parts[1], parts[2]];
    }
  }
  return null;
}

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative-luminance contrast ratio (1–21). */
export function contrastRatio(a: string, b: string): number | null {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return null;
  const lum = (c: [number, number, number]) =>
    0.2126 * channelLuminance(c[0]) +
    0.7152 * channelLuminance(c[1]) +
    0.0722 * channelLuminance(c[2]);
  const la = lum(ca);
  const lb = lum(cb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Below this the pairing is not legible at any size; the reference's own
 *  #DED9D7-on-#7C6A60 sits at 3.67, so the floor is AA-large rather than AA. */
export const PANEL_CONTRAST_FLOOR = 3;

/**
 * Pick the first candidate that clears AA against `background`, falling back
 * to the highest-contrast one. Used where a themed fill (the accent pip) can
 * be any lightness and a fixed foreground would sometimes vanish.
 */
export function readableOn(background: string, candidates: string[]): string {
  let best = candidates[0];
  let bestRatio = -1;
  for (const c of candidates) {
    const r = contrastRatio(c, background);
    if (r === null) continue;
    if (r >= 4.5) return c;
    if (r > bestRatio) {
      bestRatio = r;
      best = c;
    }
  }
  return best;
}

/**
 * Foreground for the brown calendar block and CTAs.
 *
 * Most palettes are fine, but an admin is free to pick a pale primary, which
 * would leave the block unreadable. When the configured pair falls under the
 * floor we swap in whichever of white/black actually reads. An unparseable
 * color is left alone — better to honour an intentional custom value than to
 * override it on a guess.
 */
export function resolvePanelForeground(
  theme: Pick<TemplateTheme, "primary" | "ctaPrimaryText">,
): string {
  const ratio = contrastRatio(theme.ctaPrimaryText, theme.primary);
  if (ratio === null || ratio >= PANEL_CONTRAST_FLOOR) return theme.ctaPrimaryText;
  const white = contrastRatio("#FFFFFF", theme.primary) ?? 0;
  const black = contrastRatio("#000000", theme.primary) ?? 0;
  return white >= black ? "#FFFFFF" : "#000000";
}

export interface MbTokens {
  /** Content column width in px — the reference measures 480. */
  column: number;
  gutter: number;
  heroText: string;
  /** Hairline separator used between date parts and around swatches. */
  rule: string;
  card: { bg: string; radius: number; pad: string };
  /** The inverted block the reception info sits on. */
  panel: { bg: string; fg: string; radius: number };
  /** Tracked uppercase micro-labels ("THE WEDDING OF", "THE GROOM"). */
  eyebrow: { font: string; size: number; tracking: number };
  title: { font: string; size: number; weight: number; tracking: number };
  /** Lift for foreground artwork — sprigs, the gift box. The reference tints
   *  none of its artwork; it only casts these shadows. */
  decorShadow: string;
  /** The polaroid frame carries a slightly softer, larger shadow. */
  frameShadow: string;
  gap: { section: number; block: number; row: number };
}

/**
 * The design language of this layout, resolved once from the theme.
 *
 * Every section reads these instead of literals. That is what makes the
 * template genuinely customizable: changing Theme.primary in the admin
 * repaints the reception panel, the rules, the schedule bullets and the CTAs
 * together, rather than leaving some of them stranded on a hard-coded brown.
 */
export function mbTokens(theme: TemplateTheme): MbTokens {
  return {
    column: 480,
    /** Horizontal inset of a section card inside the column (measured: a 390
     *  viewport yields 343px-wide cards). */
    gutter: 23.5,
    rule: `1px solid ${mixWithTransparent(theme.primary, 22)}`,
    card: { bg: theme.cardBg, radius: 10, pad: "26px 18px" },
    /** The brown block behind the month calendar, and the filled CTA pill. */
    panel: {
      bg: theme.primary,
      fg: resolvePanelForeground(theme),
      radius: 10,
    },
    eyebrow: { font: theme.uiFont, size: 10, tracking: 1.4 },
    title: {
      font: theme.sectionTitleFont || theme.bodyFont,
      size: theme.sectionTitleFontSize ?? 20,
      weight: Number(theme.sectionTitleFontWeight ?? 700),
      tracking: 0.5,
    },
    /** The hero names and eyebrow sit between the primary and secondary text
     *  colors in the reference (#827771 against #7C6A60 / #918077), so derive
     *  rather than add a sixth colour role to the theme. */
    heroText: `color-mix(in srgb, ${theme.textPrimary} 55%, ${theme.textSecondary})`,
    decorShadow: "drop-shadow(4px 4px 2px rgba(0,0,0,0.25))",
    frameShadow: "drop-shadow(4px 4px 4px rgba(0,0,0,0.2))",
    gap: { section: 56, block: 24, row: 12 },
  };
}

/** Element keys available to this layout's inline text editor. */
export type MbTextKey = keyof NonNullable<TextStyleOverrides["elements"]>;

/**
 * Merge the admin's per-element text-style override (font / size / color /
 * weight / letter-spacing) over a component's base style. With no override the
 * base is returned unchanged, so the public page renders identically.
 * Mirrors efStyle.
 */
export function mbStyle(
  base: CSSProperties,
  textStyles: TextStyleOverrides | null | undefined,
  key: MbTextKey,
): CSSProperties {
  return applyOverride(base, textStyles?.elements?.[key]);
}

/**
 * Card surface for a section, honouring the invitation's per-section overrides
 * and falling back to the theme. Mirrors the helper the default page uses, so
 * the card toolbar in the admin works the same way on this layout.
 */
export function mbCardStyle(
  cardStyles: CardStyleOverrides | null | undefined,
  theme: TemplateTheme,
  section: CardSectionKey,
  defaultRadius: number,
) {
  const o = cardStyles?.[section];
  return {
    cardBg: o?.cardBg || theme.cardBg,
    cardBorder: o?.cardBorder || theme.cardBorder,
    borderRadius: o?.borderRadius ?? defaultRadius,
    accentColor: o?.accentColor,
    plain: o?.plain === true,
  };
}

// ---------------------------------------------------------------------------
// Month calendar
// ---------------------------------------------------------------------------

export interface MonthDayCell {
  day: number;
  isTarget: boolean;
}

export interface MonthGrid {
  year: number;
  /** 0-indexed, matching Date.getUTCMonth(). */
  month: number;
  weeks: (MonthDayCell | null)[][];
}

/**
 * Build the calendar grid for the month containing `iso`, marking that day.
 *
 * Reads the UTC parts of the instant so the grid matches the stored date
 * regardless of where the guest is — a wedding on the 16th must never render
 * on the 15th for someone further west.
 *
 * `weekStartsOn`: 1 = Monday (the pt-PT default), 0 = Sunday.
 * Returns null when `iso` can't be parsed so callers can hide the section.
 */
export function buildMonthGrid(
  iso: string,
  weekStartsOn: 0 | 1 = 1,
): MonthGrid | null {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;

  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const targetDay = date.getUTCDate();

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const lead = (firstWeekday - weekStartsOn + 7) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: (MonthDayCell | null)[] = Array(lead).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, isTarget: day === targetDay });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (MonthDayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { year, month, weeks };
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

/**
 * Stagger for looping idle animations.
 *
 * Every sprig and leaf running the same keyframes in lockstep reads as a single
 * pulse rather than ambient drift, so each element gets its own offset spread
 * across the cycle. Deterministic (no random) so server and client agree.
 */
export function idleDelay(index: number, cycleSeconds: number): number {
  if (!Number.isFinite(index) || index < 0) return 0;
  // Golden-ratio stepping distributes any number of elements evenly without
  // knowing the total up front.
  const phase = (index * 0.618033988749895) % 1;
  return Number((phase * cycleSeconds).toFixed(2));
}

/** Parallax offset for a decorative layer, clamped so it can never drift far
 *  enough to expose an edge. */
export function parallaxOffset(
  scrollY: number,
  factor: number,
  max: number,
): number {
  if (!Number.isFinite(scrollY)) return 0;
  const raw = scrollY * factor;
  return Math.max(-max, Math.min(max, raw));
}

export interface AutoScrollState {
  /** Timestamp of the previous frame, ms. */
  lastMs: number;
  /** Position we last set ourselves, px. */
  lastY: number;
}

export interface AutoScrollFrame {
  nextY: number;
  done: boolean;
}

/**
 * One frame of the opening auto-scroll.
 *
 * Time-based rather than per-frame increments, so the crawl runs at the same
 * speed on a 120Hz phone and a throttled background tab. A long gap (tab was
 * hidden) is capped rather than applied, otherwise returning to the tab would
 * teleport the reader down the page.
 */
export function autoScrollFrame(
  nowMs: number,
  state: AutoScrollState,
  speedPxPerSec: number,
  maxScrollY: number,
): AutoScrollFrame {
  const elapsed = Math.max(0, Math.min(nowMs - state.lastMs, 100));
  const nextY = Math.min(state.lastY + (elapsed / 1000) * speedPxPerSec, maxScrollY);
  return { nextY, done: nextY >= maxScrollY - 1 };
}

/**
 * True when a scroll position differs enough from what we last set to be the
 * reader rather than us.
 *
 * Browsers round and rubber-band scroll positions, so an exact comparison
 * would read our own writes as user input and cancel the crawl immediately.
 */
export function isUserScroll(
  observedY: number,
  ourLastY: number,
  tolerance = 4,
): boolean {
  return Math.abs(observedY - ourLastY) > tolerance;
}

// ---------------------------------------------------------------------------
// Guestbook
// ---------------------------------------------------------------------------

export type { GuestbookConfig };

export interface Wish {
  id: string;
  guestName: string;
  message: string;
  submittedAt: Date;
}

interface WishSource {
  id: string;
  guestName: string;
  message: string | null;
  submittedAt: Date;
}

export function isGuestbookEnabled(
  config: GuestbookConfig | null | undefined,
): boolean {
  return config?.enabled === true;
}

/**
 * Turn RSVP rows into the public wishes list: only responses that actually
 * carry a message, minus anything the host hid, newest first.
 *
 * Returns an empty list when the guestbook is off, so a caller can't leak
 * private messages by forgetting to check the toggle first.
 */
export function resolveWishes(
  rows: WishSource[],
  config: GuestbookConfig | null | undefined,
): Wish[] {
  if (!isGuestbookEnabled(config)) return [];
  const hidden = new Set(config?.hiddenResponseIds ?? []);
  return rows
    .filter((r) => !hidden.has(r.id) && (r.message ?? "").trim().length > 0)
    .map((r) => ({
      id: r.id,
      guestName: r.guestName,
      message: (r.message ?? "").trim(),
      submittedAt: r.submittedAt,
    }))
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}
