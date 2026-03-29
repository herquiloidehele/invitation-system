/** Theme name / slug identifier (e.g. "pink-floral"). Open-ended — themes are stored in the database. */
export type TemplateName = string;

/** Invitation type — determines what is shown after the envelope cover opens. */
export type InvitationType = "standard" | "external_video" | "external_link";

/** Visual style for the Save the Date section in the invitation page */
export type SaveDateStyle =
  | "classic"
  | "countdown"
  | "quad-cards"
  | "cinematic"
  | "minimal-line";

export interface CoupleInfo {
  bride: string;
  groom: string;
  monogram: string;
}

export interface DateInfo {
  iso: string;
  display: string;
  dayOfWeek: string;
  time: string;
  day: string;
  month: string;
  year: string;
}

export interface LocationInfo {
  name: string;
  address: string;
  googleMapsUrl: string;
  wazeUrl?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

export interface ScheduleEvent {
  time: string;
  label: string;
  venue: string;
}

export interface DressCode {
  enabled: boolean;
  text: string;
}

export interface GiftRegistry {
  enabled: boolean;
  text: string;
  link?: string;
}

export interface AudioConfig {
  enabled: boolean;
  src: string;
  artist: string;
  title: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface GuestGuideItem {
  /** Stable identifier: slug for predefined items, uuid for custom */
  id: string;
  /** Display label shown below the icon */
  label: string;
  /** "lucide" uses a named Lucide icon; "svg" uses a recolorable uploaded SVG; "image" uses a raster image URL */
  iconType: "lucide" | "svg" | "image";
  /** Lucide icon component name (e.g. "CheckCircle2"). Used when iconType === "lucide". */
  iconName?: string;
  /** S3 / public asset URL. Used when iconType === "svg" or "image". */
  iconUrl?: string;
}

export interface GuestGuide {
  enabled: boolean;
  items: GuestGuideItem[];
}

export interface SectionImages {
  /** Full-bleed image shown between the hero/names section and the date card. */
  image1?: string;
  /** Full-bleed image shown between the schedule section and the info cards. */
  image2?: string;
  /** Full-bleed image shown between the location card and the guest guide / FAQs. */
  image3?: string;
  /** Decorative image shown inside the footer area. */
  image4?: string;
}

export interface EnvelopeConfig {
  /** Override the envelope body fill color (hex). Falls back to theme default if empty. */
  base?: string;
  /** Override the top flap image URL. Falls back to theme default if empty. */
  topFlap?: string;
  /** Override the bottom flap image URL. Falls back to theme default if empty. */
  bottomFlap?: string;
  /** Enable/disable the diagonal shimmer highlight animation on the envelope cover. Defaults to true. */
  shimmer?: boolean;
}

export interface OurStory {
  /** Whether to show the "Nossa História" section. */
  enabled: boolean;
  /** Section title — defaults to "Nossa História". */
  title: string;
  /** The couple's story narrative. */
  description: string;
}

export interface ParentsInfo {
  /** Whether to show the parents mode in the hero section. */
  enabled: boolean;
  /** E.g. "Com a bênção dos Pais" */
  blessingMessage: string;
  /** E.g. "Convidam para celebração do seu casamento" */
  inviteMessage: string;
  bridesFather: string;
  bridesMother: string;
  groomsFather: string;
  groomsMother: string;
}

// ---------------------------------------------------------------------------
// Per-invitation card style overrides
// ---------------------------------------------------------------------------

/** Style overrides for a single card/section (all fields optional). */
export interface CardStyle {
  /** Background color (e.g. "rgba(255,255,255,0.65)" or "#FFF"). Falls back to theme.cardBg. */
  cardBg?: string;
  /** Border color (e.g. "rgba(201,169,98,0.08)"). Falls back to theme.cardBorder. */
  cardBorder?: string;
}

/** Identifiers for each card section whose background can be individually overridden. */
export type CardSectionKey =
  | "saveTheDate"
  | "ourStory"
  | "schedule"
  | "dressCode"
  | "giftRegistry"
  | "location"
  | "guestGuide"
  | "faqs";

/** Per-section card styling overrides stored on each invitation.
 *  Missing keys or undefined fields fall back to theme defaults.
 */
export type CardStyleOverrides = Partial<Record<CardSectionKey, CardStyle>>;

// ---------------------------------------------------------------------------
// Per-invitation text style overrides
// ---------------------------------------------------------------------------

/** Style overrides for a single text element (all fields optional). */
export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string | number;
  letterSpacing?: number;
}

/** Two-tier text styling overrides stored on each invitation.
 *
 * Tier 1 — role-based overrides: broadly replace the theme's font-family
 * and color slots for every element that uses that role.
 *
 * Tier 2 — element-specific overrides: fine-tune individual text elements
 * (highest specificity, wins over both theme defaults and role overrides).
 */
export interface TextStyleOverrides {
  /** Override the theme's four font-family roles. */
  fonts?: {
    display?: string;
    body?: string;
    script?: string;
    ui?: string;
  };
  /** Override the theme's text-color roles. */
  colors?: {
    textPrimary?: string;
    textSecondary?: string;
    textMuted?: string;
    accent?: string;
  };
  /** Per-element overrides (highest specificity). */
  elements?: {
    coupleNames?: TextStyle;
    ampersand?: TextStyle;
    quote?: TextStyle;
    sectionTitles?: TextStyle;
    bodyText?: TextStyle;
    labels?: TextStyle;
    inviteLabel?: TextStyle;
    faqQuestion?: TextStyle;
    faqAnswer?: TextStyle;
    dateDay?: TextStyle;
    dateMonth?: TextStyle;
    dateYear?: TextStyle;
    dateTime?: TextStyle;
    blessingMessage?: TextStyle;
    parentsNames?: TextStyle;
    inviteMessage?: TextStyle;
    footerMonogram?: TextStyle;
    footerDate?: TextStyle;
    ctaLabel?: TextStyle;
    giftLink?: TextStyle;
    locationName?: TextStyle;
    locationAddress?: TextStyle;
    guideItemLabel?: TextStyle;
    guideScriptTitle?: TextStyle;
    saveLabel?: TextStyle;
    calendarCta?: TextStyle;
    countdownValue?: TextStyle;
    countdownLabel?: TextStyle;
    countdownDate?: TextStyle;
    countdownWeekday?: TextStyle;
  };
}

export interface InvitationData {
  slug: string;
  /** The theme's database id — used when saving/updating invitations. */
  themeId: string;
  /** The theme's slug name (e.g. "pink-floral") — derived from the Theme relation. */
  template: TemplateName;
  couple: CoupleInfo;
  date: DateInfo;
  quote: string;
  location: LocationInfo;
  rsvp: {
    enabled: boolean;
    deadline?: string;
  };
  schedule: ScheduleEvent[];
  dressCode: DressCode;
  giftRegistry: GiftRegistry;
  audio: AudioConfig;
  heroImage: string;
  videoUrl?: string;
  faqs?: FAQItem[];
  /** "Manual do bom convidado" section — optional list of icon + label tips for guests. */
  guestGuide?: GuestGuide;
  /** Per-invitation envelope appearance overrides. Missing fields fall back to theme defaults. */
  envelope?: EnvelopeConfig;
  /** Visual style for the Save the Date section. Defaults to "classic". */
  saveDateStyle?: SaveDateStyle;
  /** Background image for the "cinematic" Save the Date style. Falls back to a default Unsplash photo if empty. */
  cinematicImageUrl?: string;
  /** Optional decorative images placed between sections and in the footer. Each falls back to a default Unsplash photo if not provided. */
  sectionImages?: SectionImages;
  /** Optional parents info for the "parents mode" hero section. */
  parents?: ParentsInfo;
  /** Optional "Nossa História" section — the couple's story. */
  ourStory?: OurStory;
  /** Per-invitation text style overrides (fonts, colors, sizes). Missing fields fall back to theme defaults. */
  textStyles?: TextStyleOverrides;
  /** Per-section card background/border overrides. Missing keys fall back to theme.cardBg / theme.cardBorder. */
  cardStyles?: CardStyleOverrides;
  /** Invitation type — determines what content is shown after the envelope opens. Defaults to "standard". */
  invitationType: InvitationType;
  /** External URL for the iframe page (external_link type). */
  externalLink?: string;
}

export interface TemplateTheme {
  /** The database id (cuid) of the theme record. */
  id: string;
  name: TemplateName;
  label: string;
  description: string;
  // Cover envelope colors
  envelope: {
    base: string;
    topFlap: string;
    bottomFlap: string;
  };
  // Invitation page colors
  bg: string;
  cardBg: string;
  cardBorder: string;
  primary: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Typography
  displayFont: string;
  bodyFont: string;
  scriptFont?: string;
  /** UI font for labels, buttons, small text (replaces hardcoded Inter) */
  uiFont: string;
  // CTA styling
  ctaPrimaryBg: string;
  ctaPrimaryText: string;
  ctaSecondaryBorder: string;
  ctaSecondaryText: string;
  // Border radius for buttons
  ctaRadius: string;
  // Cover
  monogramColor: string;
  tapTextColor: string;
  // Atmospheric / decorative (new)
  /** Subtle radial gradient wash behind key sections */
  bgGradient?: string;
  /** Decorative line/dot color between sections */
  decorativeColor: string;
  /** Button hover glow color */
  ctaGlow?: string;
}
