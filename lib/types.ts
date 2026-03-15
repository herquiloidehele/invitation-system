export type TemplateName = "pink-floral" | "modern-minimal" | "boho-chic" | "midnight-elegance";

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

export interface InvitationData {
  slug: string;
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
}

export interface TemplateTheme {
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
}
