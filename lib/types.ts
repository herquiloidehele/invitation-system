/** Theme name / slug identifier (e.g. "pink-floral"). Open-ended — themes are stored in the database. */
export type TemplateName = string;

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
  /** "lucide" uses a named Lucide icon; "image" uses a user-uploaded image URL */
  iconType: "lucide" | "image";
  /** Lucide icon component name (e.g. "CheckCircle2"). Used when iconType === "lucide". */
  iconName?: string;
  /** S3 / public image URL. Used when iconType === "image". */
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
  dressCode: string;
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
