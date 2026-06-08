/** Theme name / slug identifier (e.g. "pink-floral"). Open-ended — themes are stored in the database. */
export type TemplateName = string;

/** Invitation type — determines what is shown after the envelope cover opens. */
export type InvitationType = "standard" | "external_video" | "external_link";

/** Event type — determines whether the invitation displays one or two names. */
export type InvitationEventType =
  | "wedding"
  | "anniversary"
  | "baptism"
  | "engagement"
  | "other";

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
  mapZoom?: number;
}

export type ScheduleStyle = "default" | "illustrated";

export type ScheduleIcon =
  | "neutral"
  | "rings"
  | "church"
  | "cross"
  | "heart"
  | "heart-handshake"
  | "toast"
  | "dinner"
  | "cake"
  | "coffee"
  | "dance"
  | "music"
  | "party"
  | "sparkles"
  | "gift"
  | "flower"
  | "bouquet"
  | "car"
  | "camera"
  | "sunset"
  | "bell"
  | "bird"
  | "map"
  | "custom";

export interface ScheduleEvent {
  time: string;
  label: string;
  venue: string;
  icon?: ScheduleIcon;
  iconUrl?: string;
}

export interface DressCode {
  enabled: boolean;
  text: string;
  colors?: string[]; // 1-6 hex color values, e.g. ["#000000", "#FFFFFF"]
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

/**
 * Visual overlay controls for the hero section.
 * - `scrimOpacity` darkens the hero video background (0–1). Ignored for image heroes.
 * - `gradientStart` is the percent (0–100) at which the bottom gradient
 *   begins to fade into the theme background.
 */
export interface HeroOverlayConfig {
  scrimOpacity?: number;
  gradientStart?: number;
}

/**
 * Optional animated scroll-down indicator shown at the bottom of the hero
 * (above the audio player). When `enabled` is true, an animated chevron
 * arrow appears that scrolls the page to the next section on click.
 * `color` overrides the chevron stroke color; falls back to `theme.textPrimary`.
 */
export interface HeroScrollIndicatorConfig {
  enabled: boolean;
  color?: string;
}

// ---------------------------------------------------------------------------
// Social preview / Open Graph
// ---------------------------------------------------------------------------

/** Optional override values shown when a public link is unfurled on social platforms. */
export interface SocialPreview {
  /** Full URL to a 1200×630 image. Falls back to per-subsystem fallback chain when absent. */
  image?: string;
  /** OG/Twitter title override. Falls back to per-subsystem default. */
  title?: string;
  /** OG/Twitter description override. Falls back to per-subsystem default. */
  description?: string;
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

// ---------------------------------------------------------------------------
// Image position & zoom settings
// ---------------------------------------------------------------------------

/** Position and zoom settings for a single image. */
export interface ImageSettings {
  /** Horizontal focal-point position as a percentage (0–100). 50 = centred. */
  positionX: number;
  /** Vertical focal-point position as a percentage (0–100). 50 = centred. */
  positionY: number;
  /** Zoom / scale factor. 1 = no zoom (default), up to 2.5. */
  zoom: number;
}

/** Default settings used when no override is stored. */
export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  positionX: 50,
  positionY: 50,
  zoom: 1,
};

/** Identifiers for every image slot that supports position/zoom. */
export type ImageSettingsKey =
  | "heroImage"
  | "sectionImage1"
  | "sectionImage2"
  | "sectionImage3"
  | "sectionImage4"
  | "cinematicImage"
  | "locationImage1"
  | "locationImage2"
  | "envelopeTopFlap"
  | "envelopeBottomFlap"
  | "scratchRevealBackground"
  | "countdownBackground"
  | "personalGuestCardBackground";

/** Map of image-slot key → position/zoom settings. */
export type ImageSettingsMap = Partial<Record<ImageSettingsKey, ImageSettings>>;

export interface EnvelopeConfig {
  /** Override the envelope body fill color (hex). Falls back to theme default if empty. */
  base?: string;
  /** Override the full envelope cover background with a color or image URL. Falls back to base/theme color if empty. */
  coverBackground?: string;
  /** Color used for supported mobile browser UI chrome. Falls back to cover/base colors when empty. */
  browserUiColor?: string;
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

export interface ExternalCountdownConfig {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  daysLabel?: string;
  hoursLabel?: string;
  minutesLabel?: string;
  secondsLabel?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundScrimOpacity?: number;
  cardBg?: string;
  cardBorder?: string;
  cardBorderRadius?: number;
}

/**
 * Toggles and styles the ScratchDateReveal section. Position/zoom for
 * `backgroundImageUrl` are stored in `InvitationData.imageSettings` under the
 * `scratchRevealBackground` key (mirrors the cinematic image pattern).
 */
export interface ScratchRevealConfig {
  /** Whether the section renders at all. */
  enabled: boolean;
  /** Optional full-bleed background image URL behind the coins. */
  backgroundImageUrl?: string | null;
  /** Opacity of the dark scrim overlay (0–1). Defaults to 0.45 when an image is set. */
  scrimOpacity?: number;
}

/**
 * Optional background image (+ scrim) shown behind the PersonalGuestCard on the
 * video-entrance and curtain-canva layouts. Position/zoom for
 * `backgroundImageUrl` are stored in `InvitationData.imageSettings` under the
 * `personalGuestCardBackground` key (mirrors the scratch-reveal pattern).
 */
export interface PersonalGuestCardConfig {
  /** Optional full-bleed background image URL behind the card. */
  backgroundImageUrl?: string | null;
  /** Opacity of the dark scrim overlay (0–1). Defaults to 0.45 when an image is set. */
  scrimOpacity?: number;
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
  /** Border radius in px (e.g. 20). Falls back to per-component default. */
  borderRadius?: number;
  /** Optional accent color override used by decorations inside the card
   *  (icons, connectors, etc.). Falls back to the resolved text-styles accent. */
  accentColor?: string;
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
  | "faqs"
  | "countdown";

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
  /** Override the theme's font-family roles. */
  fonts?: {
    display?: string;
    body?: string;
    script?: string;
    ui?: string;
    sectionTitle?: string;
  };
  /** Override the theme's section-title sizing. */
  sectionTitleFontSize?: number;
  sectionTitleFontWeight?: string | number;
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
    /** Video-entrance hero top text (above the couple names). */
    heroTopText?: TextStyle;
    sectionTitles?: TextStyle;
    bodyText?: TextStyle;
    dressCodeText?: TextStyle;
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
    giftText?: TextStyle;
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
    /** External invitation countdown section title. */
    externalCountdownTitle?: TextStyle;
    /** External invitation countdown section subtitle. */
    externalCountdownSubtitle?: TextStyle;
    /** External invitation countdown tile number. */
    externalCountdownValue?: TextStyle;
    /** External invitation countdown tile unit label. */
    externalCountdownLabel?: TextStyle;
    /** External invitation countdown arrival/celebration text. */
    externalCountdownCelebrationTitle?: TextStyle;
    /** Celebration title — shown when countdown reaches zero */
    celebrationTitle?: TextStyle;
    /** Celebration couple names — shown when countdown reaches zero */
    celebrationCouple?: TextStyle;
    accentLine?: TextStyle;
    /** Schedule item — time column (e.g. "16:00") */
    scheduleTime?: TextStyle;
    /** Schedule item — event label (e.g. "CERIMÔNIA") */
    scheduleLabel?: TextStyle;
    /** Schedule item — venue name (e.g. "Igreja Matriz") */
    scheduleVenue?: TextStyle;
    /** Audio player — song title */
    audioTitle?: TextStyle;
    /** Audio player — artist name */
    audioArtist?: TextStyle;
    // -- Quad Cards variant --
    quadDayValue?: TextStyle;
    quadDayLabel?: TextStyle;
    quadMonthValue?: TextStyle;
    quadMonthLabel?: TextStyle;
    quadYearValue?: TextStyle;
    quadYearLabel?: TextStyle;
    quadDayOfWeekValue?: TextStyle;
    quadDayOfWeekLabel?: TextStyle;
    quadTime?: TextStyle;
    // -- Cinematic variant --
    cinematicSaveLabel?: TextStyle;
    cinematicCouple?: TextStyle;
    cinematicDay?: TextStyle;
    cinematicMonth?: TextStyle;
    cinematicYear?: TextStyle;
    cinematicDayOfWeek?: TextStyle;
    cinematicTime?: TextStyle;
    // -- Minimal Line variant --
    minimalDay?: TextStyle;
    minimalMonth?: TextStyle;
    minimalYear?: TextStyle;
    minimalDayOfWeek?: TextStyle;
    minimalTime?: TextStyle;
    // -- Save the Date --
    /** "Save the Date" heading on the STD page */
    stdTitle?: TextStyle;
    /** Couple names on the STD page */
    stdCoupleNames?: TextStyle;
    /** "Raspe para ver a data" hint text below the heart */
    stdHint?: TextStyle;
    /** Revealed date numbers inside the scratch heart (e.g. "12.06.2026") */
    stdDate?: TextStyle;
    /** "Save the Date" label inside the scratch heart (below the date numbers) */
    stdDateLabel?: TextStyle;
    /** Custom message shown after the date is revealed */
    stdCustomMessage?: TextStyle;
    /** Bottom hero section title overlay */
    stdBottomHeroTitle?: TextStyle;
    /** Bottom hero section description overlay */
    stdBottomHeroDescription?: TextStyle;
    // -- Personal Guest Card --
    /** "— Convite Pessoal —" eyebrow label */
    guestCardLabel?: TextStyle;
    /** Guest name heading */
    guestCardName?: TextStyle;
    /** "&" + companion name block */
    guestCardCompanion?: TextStyle;
    /** Pill label (Mesa / Nota) */
    guestCardPillLabel?: TextStyle;
    /** Pill value (table label / note text) */
    guestCardPillValue?: TextStyle;
    /** "Convidar mais pessoas" button text */
    guestCardInviteButton?: TextStyle;
  };
}

// ---------------------------------------------------------------------------
// Per-invitation customizable UI text overrides
// ---------------------------------------------------------------------------

/** Every guest-visible UI string that can be overridden per invitation.
 *  All fields are optional — missing keys fall back to the built-in defaults
 *  defined in `lib/custom-texts.ts`.
 */
export interface CustomTexts {
  // -- Section Titles --
  sectionTitle_ourStory?: string;
  sectionTitle_schedule?: string;
  sectionTitle_location?: string;
  sectionTitle_dressCode?: string;
  sectionTitle_giftRegistry?: string;
  sectionTitle_guestGuide?: string;
  sectionTitle_faqs?: string;

  // -- CTA / Buttons --
  cta_confirmLabel?: string;
  cta_confirmButton?: string;
  cta_confirmedButton?: string;
  cta_giftLink?: string;
  cta_openMap?: string;
  cta_addToCalendar?: string;

  // -- Save the Date --
  saveDate_label?: string;
  saveDate_celebrationTitle?: string;
  saveDate_days?: string;
  saveDate_hours?: string;
  saveDate_minutes?: string;
  saveDate_seconds?: string;
  saveDate_dayLabel?: string;
  saveDate_monthLabel?: string;
  saveDate_yearLabel?: string;
  saveDate_dayOfWeekLabel?: string;

  // -- Hero --
  hero_inviteLabel?: string;

  // -- RSVP Modal: Form --
  rsvp_modalTitle?: string;
  rsvp_nameLabel?: string;
  rsvp_namePlaceholder?: string;
  rsvp_emailLabel?: string;
  rsvp_emailPlaceholder?: string;
  rsvp_attendingLabel?: string;
  rsvp_attendingYes?: string;
  rsvp_attendingNo?: string;
  rsvp_dietaryLabel?: string;
  rsvp_dietaryPlaceholder?: string;
  rsvp_messageLabel?: string;
  rsvp_messagePlaceholder?: string;

  // -- RSVP Modal: States & Actions --
  rsvp_deadlinePrefix?: string;
  rsvp_submitButton?: string;
  rsvp_submitting?: string;
  rsvp_successTitle?: string;
  rsvp_successMessage?: string;
  rsvp_alreadyTitle?: string;
  rsvp_alreadyMessage?: string;
  rsvp_errorTitle?: string;
  rsvp_errorMessage?: string;
  rsvp_retryButton?: string;
  rsvp_closeButton?: string;

  // -- Curtain-Canva Template --
  curtain_tapToOpen?: string;
  scratch_title?: string;
  scratch_subtitle?: string;

  // -- Misc --
  map_unavailableOffline?: string;

  // -- Personal Guest Card --
  guestCard_label?: string;
  guestCard_tableLabel?: string;
  guestCard_noteLabel?: string;
  guestCard_inviteButton?: string;

  // -- Calendar event copy --
  calendar_weddingTitle?: string;
  calendar_genericTitle?: string;
  calendar_weddingDetails?: string;
  calendar_genericDetails?: string;

  // -- InviteOthers modal --
  invite_modalTitle?: string;
  invite_modalSubtitle?: string;
  invite_nameLabel?: string;
  invite_companionLabel?: string;
  invite_submitButton?: string;
  invite_successTitle?: string;
  invite_shareLinkPrefix?: string;
  invite_addAnother?: string;
  invite_nameRequired?: string;
  invite_genericError?: string;
  invite_unknownError?: string;
  invite_linkCopied?: string;
  invite_copyFailed?: string;

  // -- Countdown defaults --
  countdown_defaultTitle?: string;
  countdown_defaultSubtitle?: string;

  // -- Envelope --
  envelope_topFlapAlt?: string;

  // -- RSVP validation --
  rsvp_nameRequired?: string;
  rsvp_invalidEmail?: string;
  rsvp_selectOption?: string;
  rsvp_deadlineClosedTitle?: string;
  rsvp_deadlineClosedMessage?: string;
  rsvp_deadlineDatePrefix?: string;

  // -- Common --
  common_close?: string;
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
  /** Optional second venue (e.g. ceremony vs. reception). Uses the same LocationInfo shape. */
  location2?: LocationInfo;
  rsvp: {
    enabled: boolean;
    deadline?: string;
    showEmail?: boolean;
    showDietaryRestrictions?: boolean;
    showOnExternalPage?: boolean;
    backgroundImageUrl?: string;
  };
  schedule: ScheduleEvent[];
  /** Visual layout for the schedule section. Defaults to "default". */
  scheduleStyle?: ScheduleStyle;
  dressCode: DressCode;
  giftRegistry: GiftRegistry;
  audio: AudioConfig;
  heroImage: string;
  /** Pixel height for image-based heroes. Missing values fall back to 300px. */
  heroHeight?: number;
  /** Optional overlay tuning for the hero (dark scrim + bottom gradient). */
  heroOverlay?: HeroOverlayConfig;
  /** Optional animated scroll-down indicator at the bottom of the hero. */
  heroScrollIndicator?: HeroScrollIndicatorConfig;
  /** Hero background video. On standard invitations this is the InvitationHero video; on curtain-canva it's the looping full-screen hero shown after the curtain opens. */
  videoUrl?: string;
  /** Poster for `videoUrl` (the hero video). Optional. */
  videoPoster?: string;
  /** Curtain-canva only: the curtain animation video played on tap. Falls back to the bundled default when empty. */
  curtainVideoUrl?: string;
  /** Poster for `curtainVideoUrl` — the closed-curtain still shown (esp. on iOS) while the curtain video loads. */
  curtainVideoPoster?: string;
  /** Video-entrance only: seconds into the entrance video at which the hero text reveals. Unset → default (5s). */
  heroRevealSeconds?: number;
  /** Video-entrance only: the top text line shown above the couple names in the hero. */
  heroTopText?: string;
  /** Video-entrance only: whether the cover prompt (play button + tap hint) is shown before tapping. Shown by default; only `false` hides it. */
  heroTapPrompt?: boolean;
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
  /** Toggles and styles the ScratchDateReveal section on external_link invitation pages. */
  scratchReveal?: ScratchRevealConfig;
  /** Toggles the curtain-canva hero celebration confetti. Unset → fires (default on); only `{ enabled: false }` disables it. */
  heroConfetti?: { enabled: boolean };
  /** Toggles and styles the countdown section on external_link invitation pages. */
  countdown?: ExternalCountdownConfig;
  /** Optional background image + scrim shown behind the personal guest card (video-entrance & curtain-canva layouts). */
  personalGuestCard?: PersonalGuestCardConfig;
  /** Per-invitation text style overrides (fonts, colors, sizes). Missing fields fall back to theme defaults. */
  textStyles?: TextStyleOverrides;
  /** Per-section card background/border overrides. Missing keys fall back to theme.cardBg / theme.cardBorder. */
  cardStyles?: CardStyleOverrides;
  /** Event type — wedding invitations show two names; other event types show only the primary name. */
  eventType: InvitationEventType;
  /** Invitation type — determines what content is shown after the envelope opens. Defaults to "standard". */
  invitationType: InvitationType;
  /** External URL for the iframe page (external_link type). */
  externalLink?: string;
  /** Admin-only marker for demonstration invitations. Public pages ignore it. */
  isDemo?: boolean;
  /** Per-image position & zoom overrides. Missing keys use the default (centred, zoom 1). */
  imageSettings?: ImageSettingsMap;
  /** Per-invitation UI text overrides. Missing keys fall back to built-in Portuguese defaults. */
  customTexts?: CustomTexts;
  /** Whether the guest-management feature is active for this invitation. */
  guestManagementEnabled?: boolean;
  /** WhatsApp/SMS message template with `{name}` and `{link}` placeholders. */
  guestMessageTemplate?: string;
  /** Override values used only for OG/Twitter meta tags. Image is never rendered on the page. */
  socialPreview?: SocialPreview;
  /** When the page was opened with `?g=<token>`, the matched guest. */
  guest?: PublicGuestData;
  /** Landing page listing metadata. */
  priceFromCents?: number | null;
  discountPriceFromCents?: number | null;
  currency?: string | null;
  landingModelName?: string | null;
  landingImageUrl?: string | null;
  landingDescription?: string | null;
  landingSubtitle?: string | null;
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
  /** Dedicated font for section titles (e.g. "Programação", "Nossa História"). Falls back to uiFont. */
  sectionTitleFont?: string;
  /** Default font size for section titles (px). Falls back to 10. */
  sectionTitleFontSize?: number;
  /** Default font weight for section titles. Falls back to 400. */
  sectionTitleFontWeight?: string;
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
  /**
   * Selects the rendering pipeline:
   * - "default" (or undefined): standard envelope + InvitationPage flow
   * - "curtain-canva": CurtainCanvaPage flow (skips envelope, plays curtains
   *   video, scratch date reveal, Canva iframe, inline RSVP)
   * - "video-entrance": VideoEntrancePage flow (single tap-to-play video as
   *   cover + hero, timed text reveal, then the same external sections)
   */
  layout?: "default" | "curtain-canva" | "video-entrance";
}

// ---------------------------------------------------------------------------
// Guest management
// ---------------------------------------------------------------------------

/** Public-safe guest data exposed to the invitation page (no phone). */
export interface PublicGuestData {
  /** Cuid token used in the URL (?g=<token>). */
  token: string;
  /** Display name. */
  name: string;
  /** Optional companion name. */
  companion?: string;
  /** Optional free-form table label, e.g. "7" or "Mesa Os Amigos". */
  tableLabel?: string;
  /** Optional host note for this guest. */
  note?: string;
  /** Whether this guest can invite secondary guests. */
  canInviteOthers: boolean;
  /** The slug of the invitation this guest belongs to. */
  invitationSlug: string;
  /** Optional guest-specific Canva/external link used by external-link invitations. */
  customExternalLink?: string;
}

/** Full guest data — used by host/admin management UI and APIs. */
export interface GuestData extends PublicGuestData {
  id: string;
  slugifiedName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  /** Id of the inviter, when this guest was self-registered. */
  invitedById?: string;
  /** Display name of the inviter, when known. */
  invitedByName?: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

/** Input shape used by both admin and owner-token APIs to create/update guests. */
export interface GuestUpsertInput {
  name: string;
  companion?: string;
  phoneCountryCode: string;
  phoneNumber: string;
  tableLabel?: string;
  canInviteOthers?: boolean;
  note?: string;
  customExternalLink?: string;
}
