"use client";

import {
  type MutableRefObject,
  type RefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronDown, ExternalLink, Gift, Heart, Shirt } from "lucide-react";

import type { FAQItem, InvitationData, TemplateTheme } from "@/lib/types";
import AudioPlayer from "./AudioPlayer";
import ScheduleItem from "./ScheduleItem";
import RSVPModal from "./RSVPModal";
import LocationCard from "./LocationCard";
import GuestGuideSection from "./GuestGuideSection";
import SaveTheDateSection from "./SaveTheDateSection";
import DynamicFontLoader from "./DynamicFontLoader";
import { PrefetchedVideoSlot } from "./PrefetchedVideoSlot";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Animation variants — each section has its own entrance
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

/** Gentle scale-in for the date card */
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: EASE },
  },
};

/** Slide from left for info card 1 */
const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

/** Slide from right for info card 2 */
const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

/** Very slow ambient fade for footer */
const ambientFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.6, ease: "easeOut" },
  },
};

/** Staggered reveal for hero text elements */
const heroTextContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.4 },
  },
};

const heroTextItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE },
  },
};

/** Stagger container for schedule items */
const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isScriptFont(displayFont: string): boolean {
  const lower = displayFont.toLowerCase();
  return (
    lower.includes("great vibes") ||
    lower.includes("homemade apple") ||
    lower.includes("pinyon script") ||
    lower.includes("cursive")
  );
}

function toAudioTheme(theme: TemplateTheme) {
  return {
    bgColor: theme.cardBg,
    playBtnColor: theme.accent,
    playIconColor: theme.ctaPrimaryText,
    titleColor: theme.textPrimary,
    artistColor: theme.textSecondary,
  };
}

// ---------------------------------------------------------------------------
// Noise grain overlay SVG (inlined as data URI)
// ---------------------------------------------------------------------------

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ---------------------------------------------------------------------------
// Decorative section divider
// ---------------------------------------------------------------------------

function SectionDivider({ theme }: { theme: TemplateTheme }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{
          width: 36,
          height: 1,
          background: theme.decorativeColor,
          transformOrigin: "right center",
        }}
      />
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: theme.accent,
          opacity: 0.35,
        }}
      />
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{
          width: 36,
          height: 1,
          background: theme.decorativeColor,
          transformOrigin: "left center",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full-bleed section image with gradient fades blending into the theme bg
// ---------------------------------------------------------------------------

function SectionImage({
  src,
  theme,
  height = 300,
  hiddeBottom,
}: {
  src: string;
  theme: TemplateTheme;
  height?: number;
  hiddeBottom?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      style={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
      }}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {/* Top gradient — fades from theme.bg down into transparent */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, ${theme.bg} 0%, transparent 40%)`,
          pointerEvents: "none",
        }}
      />
      {/* Bottom gradient — fades from transparent up into theme.bg */}
      {!hiddeBottom && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${theme.bg} 0%, transparent 40%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Animated section wrappers
// ---------------------------------------------------------------------------

function AnimatedSection({
  children,
  className = "",
  variants: customVariants,
  isPreview = false,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  isPreview?: boolean;
}) {
  return (
    <motion.section
      variants={customVariants ?? fadeInUp}
      initial="hidden"
      {...(isPreview
        ? { animate: "visible" }
        : {
            whileInView: "visible",
            viewport: { once: true, margin: "-60px" },
          })}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// FAQ Accordion Item — redesigned with left accent border
// ---------------------------------------------------------------------------

function FAQAccordionItem({
  faq,
  isOpen,
  onToggle,
  theme,
  isLast,
}: {
  faq: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  theme: TemplateTheme;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        borderLeft: isOpen
          ? `2px solid ${theme.accent}`
          : "2px solid transparent",
        transition: "border-color 0.35s ease",
      }}
    >
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 text-left transition-colors"
        style={{
          padding: "20px 22px",
          paddingBottom: isOpen ? 4 : 20,
          background: "transparent",
          border: "none",
        }}
      >
        {/* Question text */}
        <span
          className="flex-1"
          style={{
            fontFamily: theme.bodyFont,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.5,
            color: isOpen ? theme.textPrimary : theme.textSecondary,
            transition: "color 0.3s ease",
          }}
        >
          {faq.question}
        </span>

        {/* Chevron */}
        <motion.span
          className="flex-shrink-0"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <ChevronDown
            size={16}
            color={theme.accent}
            strokeWidth={1.5}
            style={{
              opacity: isOpen ? 1 : 0.4,
              transition: "opacity 0.3s ease",
            }}
          />
        </motion.span>
      </button>

      {/* Answer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: EASE },
              opacity: { duration: 0.3, delay: 0.05 },
            }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "4px 22px 22px" }}>
              <p
                style={{
                  fontFamily: theme.bodyFont,
                  fontSize: 12,
                  lineHeight: 1.75,
                  color: theme.textSecondary,
                  opacity: 0.8,
                  margin: 0,
                }}
              >
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider between items */}
      {!isLast && (
        <div
          style={{
            height: 1,
            background: theme.cardBorder,
            margin: "0 22px",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface InvitationPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  /** When provided, InvitationPage will adopt this existing <video> element
   *  into the hero section instead of creating a new one, avoiding duplicate
   *  network requests. */
  prefetchedVideoRef?: RefObject<HTMLVideoElement | null>;
  /** Pass true in the admin live preview so all animations are always visible
   *  and respond to React state changes rather than scroll position. */
  isPreview?: boolean;
}

export default function InvitationPage({
  invitation,
  theme,
  audioRef,
  prefetchedVideoRef,
  isPreview = false,
}: InvitationPageProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const { trackEvent } = useAnalytics(invitation.slug);

  const handleMapsClick = useCallback(
    () => trackEvent("maps_click"),
    [trackEvent],
  );
  const handleGiftClick = useCallback(
    () => trackEvent("gift_click"),
    [trackEvent],
  );
  const handleCalendarClick = useCallback(
    () => trackEvent("calendar_click"),
    [trackEvent],
  );
  const handleAudioPlay = useCallback(
    () => trackEvent("audio_play"),
    [trackEvent],
  );

  // Check localStorage on mount (client-only)
  useEffect(() => {
    try {
      const slugs: string[] = JSON.parse(
        localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
      );
      setRsvpSubmitted(slugs.includes(invitation.slug));
    } catch {
      // ignore
    }
  }, [invitation.slug]);

  const nameFontSize = isScriptFont(theme.displayFont) ? 52 : 46;

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        minHeight: "100dvh",
        position: "relative",
      }}
    >
      {/* Load any non-builtin Google Fonts used by this theme */}
      <DynamicFontLoader theme={theme} />

      {/* ================================================================= */}
      {/* Atmospheric grain overlay                                         */}
      {/* ================================================================= */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: 0.018,
          backgroundImage: GRAIN_SVG,
          backgroundSize: "200px 200px",
          animation: "invitation-grain 6s steps(8) infinite",
          zIndex: 1,
        }}
      />

      {/* ================================================================= */}
      {/* Radial gradient wash                                              */}
      {/* ================================================================= */}
      {theme.bgGradient && (
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: theme.bgGradient }}
        />
      )}

      {/* ================================================================= */}
      {/* 1. Hero — full viewport video or image                            */}
      {/* ================================================================= */}
      <section
        className="relative overflow-hidden"
        style={{ height: invitation.videoUrl ? "100dvh" : 300 }}
      >
        {/* Background media */}
        {invitation.videoUrl ? (
          prefetchedVideoRef ? (
            <PrefetchedVideoSlot videoRef={prefetchedVideoRef} />
          ) : (
            <video
              src={invitation.videoUrl}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              data-invitation-video
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        ) : (
          <img
            src={invitation.heroImage}
            alt="Hero"
            className="h-full w-full object-cover"
          />
        )}

        {/* Dark scrim (video only) */}
        {invitation.videoUrl && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "rgba(0,0,0,0.38)" }}
          />
        )}

        {/* Bottom gradient fading into theme bg */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: invitation.videoUrl
              ? `linear-gradient(to bottom, transparent 40%, ${theme.bg} 100%)`
              : `linear-gradient(to bottom, transparent 35%, ${theme.bg} 100%)`,
          }}
        />

        {/* Couple names overlay (video mode) */}
        {invitation.videoUrl && (
          <motion.div
            variants={heroTextContainer}
            initial="hidden"
            animate="visible"
            className="absolute inset-x-0 flex flex-col items-center text-center"
            style={{
              top: "50%",
              transform: "translateY(-58%)",
              padding: "0 40px",
              zIndex: 10,
            }}
          >
            {invitation.parents?.enabled ? (
              /* ── Parents Mode (video) ── */
              <>
                {/* Couple names */}
                <motion.h1
                  variants={heroTextItem}
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: nameFontSize + 10,
                    lineHeight: 1.05,
                    color: "#ffffff",
                    textShadow: "0 2px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {invitation.couple.bride}
                </motion.h1>

                <motion.span
                  variants={heroTextItem}
                  className="my-2"
                  style={{
                    fontFamily:
                      theme.scriptFont ?? "'Cormorant Garamond', serif",
                    fontSize: 34,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.75)",
                    textShadow: "0 2px 20px rgba(0,0,0,0.35)",
                  }}
                >
                  &amp;
                </motion.span>

                <motion.h1
                  variants={heroTextItem}
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: nameFontSize + 10,
                    lineHeight: 1.05,
                    color: "#ffffff",
                    textShadow: "0 2px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {invitation.couple.groom}
                </motion.h1>

                {/* Blessing message */}
                <motion.span
                  variants={heroTextItem}
                  className="mt-5"
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 13,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.65)",
                    letterSpacing: 1,
                  }}
                >
                  {invitation.parents.blessingMessage}
                </motion.span>

                {/* Parents names — two columns */}
                <motion.div
                  variants={heroTextItem}
                  className="mt-5 flex w-full max-w-sm justify-between gap-6"
                >
                  <div
                    className="flex flex-col items-start gap-0.5"
                    style={{ textAlign: "left" }}
                  >
                    {invitation.parents.bridesFather && (
                      <span
                        style={{
                          fontFamily: theme.bodyFont,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.8)",
                          lineHeight: 1.6,
                        }}
                      >
                        {invitation.parents.bridesFather}
                      </span>
                    )}
                    {invitation.parents.bridesMother && (
                      <span
                        style={{
                          fontFamily: theme.bodyFont,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.8)",
                          lineHeight: 1.6,
                        }}
                      >
                        {invitation.parents.bridesMother}
                      </span>
                    )}
                  </div>
                  <div
                    className="flex flex-col items-end gap-0.5"
                    style={{ textAlign: "right" }}
                  >
                    {invitation.parents.groomsFather && (
                      <span
                        style={{
                          fontFamily: theme.bodyFont,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.8)",
                          lineHeight: 1.6,
                        }}
                      >
                        {invitation.parents.groomsFather}
                      </span>
                    )}
                    {invitation.parents.groomsMother && (
                      <span
                        style={{
                          fontFamily: theme.bodyFont,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.8)",
                          lineHeight: 1.6,
                        }}
                      >
                        {invitation.parents.groomsMother}
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Invite message */}
                <motion.p
                  variants={heroTextItem}
                  className="mt-5"
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 13,
                    fontStyle: "italic",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.55)",
                    maxWidth: 300,
                    textAlign: "center",
                  }}
                >
                  {invitation.parents.inviteMessage}
                </motion.p>
              </>
            ) : (
              /* ── Standard Mode (video) ── */
              <>
                {/* Label */}
                <motion.span
                  variants={heroTextItem}
                  style={{
                    fontFamily: theme.uiFont,
                    fontSize: 10,
                    fontWeight: 300,
                    letterSpacing: 5,
                    textTransform: "uppercase" as const,
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  Convidam para o casamento de
                </motion.span>

                {/* Bride */}
                <motion.h1
                  variants={heroTextItem}
                  className="mt-5"
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: nameFontSize + 10,
                    lineHeight: 1.05,
                    color: "#ffffff",
                    textShadow: "0 2px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {invitation.couple.bride}
                </motion.h1>

                {/* Ampersand */}
                <motion.span
                  variants={heroTextItem}
                  className="my-2"
                  style={{
                    fontFamily:
                      theme.scriptFont ?? "'Cormorant Garamond', serif",
                    fontSize: 34,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.75)",
                    textShadow: "0 2px 20px rgba(0,0,0,0.35)",
                  }}
                >
                  &amp;
                </motion.span>

                {/* Groom */}
                <motion.h1
                  variants={heroTextItem}
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: nameFontSize + 10,
                    lineHeight: 1.05,
                    color: "#ffffff",
                    textShadow: "0 2px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {invitation.couple.groom}
                </motion.h1>

                {/* Date pill */}
                <motion.div
                  variants={heroTextItem}
                  className="mt-7 flex items-center gap-4"
                  style={{
                    fontFamily: theme.uiFont,
                    fontSize: 10,
                    fontWeight: 300,
                    letterSpacing: 6,
                    textTransform: "uppercase" as const,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 28,
                      height: 1,
                      background: "rgba(255,255,255,0.3)",
                    }}
                  />
                  {invitation.date.day}&nbsp;&middot;&nbsp;
                  {invitation.date.month}&nbsp;&middot;&nbsp;
                  {invitation.date.year}
                  <span
                    style={{
                      display: "inline-block",
                      width: 28,
                      height: 1,
                      background: "rgba(255,255,255,0.3)",
                    }}
                  />
                </motion.div>

                {/* Quote */}
                <motion.p
                  variants={heroTextItem}
                  className="mt-5"
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 14,
                    fontStyle: "italic" as const,
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.5)",
                    maxWidth: 280,
                  }}
                >
                  {invitation.quote}
                </motion.p>
              </>
            )}
          </motion.div>
        )}

        {/* Audio player */}
        {invitation.audio.enabled && (
          <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
            <AudioPlayer
              src={invitation.audio.src}
              title={invitation.audio.title}
              artist={invitation.audio.artist}
              theme={toAudioTheme(theme)}
              externalAudioRef={audioRef}
              onPlay={handleAudioPlay}
            />
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 2. Names (no-video fallback)                                      */}
      {/* ================================================================= */}
      {!invitation.videoUrl && (
        <AnimatedSection isPreview={isPreview}>
          <div
            className="flex flex-col items-center text-center"
            style={{ padding: "36px 40px" }}
          >
            {invitation.parents?.enabled ? (
              /* ── Parents Mode (image hero) ── */
              <>
                {/* Couple names */}
                <h1
                  className="mt-2"
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: nameFontSize,
                    lineHeight: 1.1,
                    color: theme.textPrimary,
                  }}
                >
                  {invitation.couple.bride}
                </h1>

                <span
                  className="my-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 26,
                    fontStyle: "italic",
                    color: theme.accent,
                  }}
                >
                  &amp;
                </span>

                <h1
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: nameFontSize,
                    lineHeight: 1.1,
                    color: theme.textPrimary,
                  }}
                >
                  {invitation.couple.groom}
                </h1>

                {/* Decorative accent line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                  className="mt-6 mb-5"
                  style={{
                    width: 48,
                    height: 1,
                    background: theme.accent,
                    opacity: 0.3,
                  }}
                />

                {/* Blessing message */}
                <p
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 13,
                    fontStyle: "italic",
                    color: theme.textSecondary,
                    letterSpacing: 0.5,
                  }}
                >
                  {invitation.parents.blessingMessage}
                </p>

                {/* Parents names — two columns */}
                <div className="mt-5 flex w-full max-w-xs justify-between gap-4">
                  <div className="flex flex-col items-start gap-0.5">
                    {invitation.parents.bridesFather && (
                      <span
                        style={{
                          fontFamily: theme.bodyFont,
                          fontSize: 13,
                          color: theme.textPrimary,
                          lineHeight: 1.6,
                          textAlign: "left",
                        }}
                      >
                        {invitation.parents.bridesFather}
                      </span>
                    )}
                    {invitation.parents.bridesMother && (
                      <span
                        style={{
                          fontFamily: theme.bodyFont,
                          fontSize: 13,
                          color: theme.textPrimary,
                          lineHeight: 1.6,
                          textAlign: "left",
                        }}
                      >
                        {invitation.parents.bridesMother}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {invitation.parents.groomsFather && (
                      <span
                        style={{
                          fontFamily: theme.bodyFont,
                          fontSize: 13,
                          color: theme.textPrimary,
                          lineHeight: 1.6,
                          textAlign: "right",
                        }}
                      >
                        {invitation.parents.groomsFather}
                      </span>
                    )}
                    {invitation.parents.groomsMother && (
                      <span
                        style={{
                          fontFamily: theme.bodyFont,
                          fontSize: 13,
                          color: theme.textPrimary,
                          lineHeight: 1.6,
                          textAlign: "right",
                        }}
                      >
                        {invitation.parents.groomsMother}
                      </span>
                    )}
                  </div>
                </div>

                {/* Decorative accent line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                  className="mt-6 mb-5"
                  style={{
                    width: 48,
                    height: 1,
                    background: theme.accent,
                    opacity: 0.3,
                  }}
                />

                {/* Invite message */}
                <p
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 14,
                    fontStyle: "italic",
                    lineHeight: 1.65,
                    color: theme.textSecondary,
                    maxWidth: 300,
                  }}
                >
                  {invitation.parents.inviteMessage}
                </p>
              </>
            ) : (
              /* ── Standard Mode (image hero) ── */
              <>
                <span
                  style={{
                    fontFamily: theme.uiFont,
                    fontSize: 10,
                    fontWeight: 300,
                    letterSpacing: 4,
                    textTransform: "uppercase" as const,
                    color: theme.textSecondary,
                  }}
                >
                  Convidam para o casamento de
                </span>

                <h1
                  className="mt-5"
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: nameFontSize,
                    lineHeight: 1.1,
                    color: theme.textPrimary,
                  }}
                >
                  {invitation.couple.bride}
                </h1>

                <span
                  className="my-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 26,
                    fontStyle: "italic",
                    color: theme.accent,
                  }}
                >
                  &amp;
                </span>

                <h1
                  style={{
                    fontFamily: theme.displayFont,
                    fontSize: nameFontSize,
                    lineHeight: 1.1,
                    color: theme.textPrimary,
                  }}
                >
                  {invitation.couple.groom}
                </h1>

                {/* Decorative accent line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                  className="mt-7 mb-5"
                  style={{
                    width: 48,
                    height: 1,
                    background: theme.accent,
                    opacity: 0.3,
                  }}
                />

                <p
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 16,
                    fontStyle: "italic" as const,
                    lineHeight: 1.65,
                    color: theme.textSecondary,
                    maxWidth: 300,
                  }}
                >
                  {invitation.quote}
                </p>
              </>
            )}
          </div>
        </AnimatedSection>
      )}

      {/* ================================================================= */}
      {/* 3. Date Card — Save the Date (style varies per invitation)        */}
      {/* ================================================================= */}
      <AnimatedSection
        className={`px-6 pb-10 ${invitation.videoUrl ? "pt-16" : ""}`}
        variants={scaleIn}
        isPreview={isPreview}
      >
        <SaveTheDateSection
          invitation={invitation}
          theme={theme}
          onCalendarClick={handleCalendarClick}
          isPreview={isPreview}
        />
      </AnimatedSection>

      {/* ================================================================= */}
      {/* IMAGE 1 — after Save the Date info                                */}
      {/* ================================================================= */}
      {invitation.sectionImages?.image1 && (
        <SectionImage src={invitation.sectionImages.image1} theme={theme} />
      )}

      <SectionDivider theme={theme} />

      {/* ================================================================= */}
      {/* 3b. Nossa História — couple's story                               */}
      {/* ================================================================= */}
      {invitation.ourStory?.enabled && invitation.ourStory.description && (
        <>
          <AnimatedSection className="px-6 pb-2" isPreview={isPreview}>
            <div className="flex flex-col items-center">
              <span
                style={{
                  fontFamily: theme.uiFont,
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: 4,
                  textTransform: "uppercase" as const,
                  color: theme.textSecondary,
                }}
              >
                {invitation.ourStory.title || "Nossa História"}
              </span>

              <motion.div
                className="mt-3 mb-6"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                style={{
                  width: 28,
                  height: 1,
                  background: theme.accent,
                  opacity: 0.25,
                }}
              />
            </div>
          </AnimatedSection>

          <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
            <div
              style={{
                background: theme.cardBg,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 20,
                overflow: "hidden",
                padding: "28px 24px",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Decorative heart icon */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: `${theme.accent}12` }}
                >
                  <Heart size={20} color={theme.accent} strokeWidth={1.5} />
                </div>

                {/* Story text */}
                <p
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: theme.textSecondary,
                    textAlign: "center",
                    margin: 0,
                    whiteSpace: "pre-line",
                  }}
                >
                  {invitation.ourStory.description}
                </p>
              </div>
            </div>
          </AnimatedSection>

          <SectionDivider theme={theme} />
        </>
      )}

      {/* ================================================================= */}
      {/* 4. Schedule                                                       */}
      {/* ================================================================= */}
      {invitation.schedule.length > 0 && (
        <>
          <AnimatedSection className="px-6 pb-2" isPreview={isPreview}>
            <div className="flex flex-col items-center">
              <span
                style={{
                  fontFamily: theme.uiFont,
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: 4,
                  textTransform: "uppercase" as const,
                  color: theme.textSecondary,
                }}
              >
                Programação
              </span>

              <motion.div
                className="mt-3 mb-6"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                style={{
                  width: 28,
                  height: 1,
                  background: theme.accent,
                  opacity: 0.25,
                }}
              />
            </div>
          </AnimatedSection>

          {/* Schedule card with staggered items */}
          <motion.div
            className="px-6 pb-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <div
              style={{
                background: theme.cardBg,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 20,
                overflow: "hidden",
                padding: "8px 0",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              {invitation.schedule.map((event, i) => (
                <div key={i}>
                  {i > 0 && (
                    <div
                      className="mx-6"
                      style={{ height: 1, background: theme.cardBorder }}
                    />
                  )}
                  <ScheduleItem
                    time={event.time}
                    label={event.label}
                    venue={event.venue}
                    accentColor={theme.accent}
                    textColor={theme.textPrimary}
                    venueColor={theme.textSecondary}
                    uiFont={theme.uiFont}
                    index={i}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          <SectionDivider theme={theme} />
        </>
      )}

      {/* ================================================================= */}
      {/* IMAGE 2 — between schedule and info cards                         */}
      {/* ================================================================= */}
      {invitation.sectionImages?.image2 && (
        <SectionImage src={invitation.sectionImages.image2} theme={theme} />
      )}

      {/* ================================================================= */}
      {/* 5. Info Cards — glassmorphism, opposing slide-ins                  */}
      {/* ================================================================= */}
      {(invitation.dressCode.enabled || invitation.giftRegistry.enabled) && (
        <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
          <div
            className={`grid ${invitation.dressCode.enabled && invitation.giftRegistry.enabled ? "grid-cols-2" : "grid-cols-1"} gap-3`}
          >
            {/* Dress Code — slides from left */}
            {invitation.dressCode.enabled && (
              <motion.div
                variants={slideFromLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                className="flex flex-col items-center gap-3 text-center"
                style={{
                  background: theme.cardBg,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderRadius: 16,
                  padding: "24px 14px",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
                  border: `1px solid ${theme.cardBorder}`,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: `${theme.accent}12`,
                  }}
                >
                  <Shirt size={20} color={theme.accent} strokeWidth={1.5} />
                </div>
                <span
                  style={{
                    fontFamily: theme.uiFont,
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: 3,
                    textTransform: "uppercase" as const,
                    color: theme.textMuted,
                  }}
                >
                  Dress Code
                </span>
                <span
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 13,
                    fontWeight: 500,
                    color: theme.textPrimary,
                  }}
                >
                  {invitation.dressCode.text}
                </span>
              </motion.div>
            )}

            {/* Gift Registry — slides from right */}
            {invitation.giftRegistry.enabled && (
              <motion.div
                variants={slideFromRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                className="flex flex-col items-center gap-3 text-center"
                style={{
                  background: theme.cardBg,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderRadius: 16,
                  padding: "24px 14px",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
                  border: `1px solid ${theme.cardBorder}`,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: `${theme.accent}12`,
                  }}
                >
                  <Gift size={20} color={theme.accent} strokeWidth={1.5} />
                </div>
                <span
                  style={{
                    fontFamily: theme.uiFont,
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: 3,
                    textTransform: "uppercase" as const,
                    color: theme.textMuted,
                  }}
                >
                  Presentes
                </span>
                <span
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: 13,
                    fontWeight: 500,
                    color: theme.textPrimary,
                  }}
                >
                  {invitation.giftRegistry.text}
                </span>
                {invitation.giftRegistry.link && (
                  <motion.a
                    href={invitation.giftRegistry.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleGiftClick}
                    className="flex items-center justify-center gap-1.5 mt-1 transition-opacity hover:opacity-70"
                    style={{
                      fontFamily: theme.uiFont,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: 1.5,
                      textTransform: "uppercase" as const,
                      color: theme.accent,
                      textDecoration: "none",
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <ExternalLink size={10} strokeWidth={1.5} />
                    Ver lista
                  </motion.a>
                )}
              </motion.div>
            )}
          </div>
        </AnimatedSection>
      )}

      <SectionDivider theme={theme} />

      {/* ================================================================= */}
      {/* 5b. Location Card Section                                         */}
      {/* ================================================================= */}
      <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
        <LocationCard
          location={invitation.location}
          theme={theme}
          onMapsClick={handleMapsClick}
        />
      </AnimatedSection>

      {/* ================================================================= */}
      {/* IMAGE 3 — between location and guest guide / FAQs                 */}
      {/* ================================================================= */}
      {invitation.sectionImages?.image3 && (
        <SectionImage src={invitation.sectionImages.image3} theme={theme} />
      )}

      {/* ================================================================= */}
      {/* 6. Manual do Bom Convidado                                        */}
      {/* ================================================================= */}
      {invitation.guestGuide?.enabled &&
        invitation.guestGuide.items.length > 0 && (
          <>
            <SectionDivider theme={theme} />

            <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
              <GuestGuideSection
                guestGuide={invitation.guestGuide}
                theme={theme}
                isPreview={isPreview}
              />
            </AnimatedSection>
          </>
        )}

      {/* ================================================================= */}
      {/* 7. FAQs                                                           */}
      {/* ================================================================= */}
      {invitation.faqs && invitation.faqs.length > 0 && (
        <>
          <SectionDivider theme={theme} />

          <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
            <div className="flex flex-col items-center">
              <span
                style={{
                  fontFamily: theme.uiFont,
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: 4,
                  textTransform: "uppercase" as const,
                  color: theme.textSecondary,
                }}
              >
                Perguntas Frequentes
              </span>

              <motion.div
                className="mt-3 mb-6"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                style={{
                  width: 28,
                  height: 1,
                  background: theme.accent,
                  opacity: 0.25,
                }}
              />
            </div>

            {/* FAQ card */}
            <div
              style={{
                background: theme.cardBg,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              {invitation.faqs.map((faq, i) => (
                <FAQAccordionItem
                  key={i}
                  faq={faq}
                  index={i}
                  isOpen={openFaqIndex === i}
                  onToggle={() =>
                    setOpenFaqIndex(openFaqIndex === i ? null : i)
                  }
                  theme={theme}
                  isLast={i === (invitation.faqs?.length ?? 0) - 1}
                />
              ))}
            </div>
          </AnimatedSection>
        </>
      )}

      <SectionDivider theme={theme} />

      {/* ================================================================= */}
      {/* 6. CTA Section                                                    */}
      {/* ================================================================= */}
      <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
        <div className="flex flex-col items-center">
          <span
            className="mb-6"
            style={{
              fontFamily: theme.uiFont,
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: 4,
              textTransform: "uppercase" as const,
              color: theme.textSecondary,
            }}
          >
            Confirme sua presença
          </span>
        </div>

        <div className="flex flex-col items-center">
          {/* Confirmar Presença */}
          <motion.button
            onClick={() => setRsvpOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-4 font-medium transition-all"
            style={{
              fontFamily: theme.uiFont,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 1,
              background: rsvpSubmitted ? "#22c55e" : theme.ctaPrimaryBg,
              color: rsvpSubmitted ? "#fff" : theme.ctaPrimaryText,
              borderRadius: theme.ctaRadius,
              cursor: rsvpSubmitted ? "default" : "pointer",
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart size={17} strokeWidth={1.5} />
            {rsvpSubmitted ? "Presença Confirmada" : "Confirmar Presença"}
          </motion.button>
        </div>
      </AnimatedSection>

      {/* ================================================================= */}
      {/* 8. Footer — monogram with decorative ring                         */}
      {/* ================================================================= */}
      <AnimatedSection variants={ambientFade} isPreview={isPreview}>
        <footer className="flex flex-col items-center pb-12 pt-6">
          {/* Decorative accent line */}
          <motion.div
            className="mb-8"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE }}
            style={{
              width: 48,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
              opacity: 0.2,
            }}
          />

          {/* Monogram with decorative ring */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 64, height: 64 }}
          >
            {/* Rotating ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: `1px dashed ${theme.decorativeColor}`,
                animation: "slow-rotate 30s linear infinite",
                opacity: 0.5,
              }}
            />
            <span
              style={{
                fontFamily: theme.displayFont,
                fontSize: 22,
                color: theme.textMuted,
                letterSpacing: 2,
              }}
            >
              {invitation.couple.monogram}
            </span>
          </div>

          {/* Date */}
          <span
            className="mt-4"
            style={{
              fontFamily: theme.uiFont,
              fontSize: 10,
              fontWeight: 300,
              letterSpacing: 3,
              color: theme.textMuted,
            }}
          >
            {invitation.date.day} &middot; {invitation.date.month} &middot;{" "}
            {invitation.date.year}
          </span>
        </footer>
      </AnimatedSection>

      {/* ================================================================= */}
      {/* IMAGE 4 — bottom of page                                          */}
      {/* ================================================================= */}
      {invitation.sectionImages?.image4 && (
        <SectionImage
          src={invitation.sectionImages.image4}
          theme={theme}
          height={220}
          hiddeBottom
        />
      )}

      {/* ================================================================= */}
      {/* RSVP Modal                                                        */}
      {/* ================================================================= */}
      <RSVPModal
        open={rsvpOpen}
        onClose={() => {
          setRsvpOpen(false);
          // Refresh submitted state after modal closes
          try {
            const slugs: string[] = JSON.parse(
              localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
            );
            setRsvpSubmitted(slugs.includes(invitation.slug));
          } catch {
            // ignore
          }
        }}
        invitation={invitation}
        theme={theme}
      />
    </div>
  );
}
