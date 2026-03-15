"use client";

import { useState, type MutableRefObject } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {  MapPin, Heart, Shirt, Gift, ChevronDown, HelpCircle } from "lucide-react";

import type { InvitationData, TemplateTheme, FAQItem } from "@/lib/types";
import AudioPlayer from "./AudioPlayer";
import ScheduleItem from "./ScheduleItem";
import RSVPModal from "./RSVPModal";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

/** Staggered reveal for the video hero text elements. */
const heroTextContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.4 },
  },
};

const heroTextItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Script / cursive display fonts get a larger name size for visual impact. */
function isScriptFont(displayFont: string): boolean {
  const lower = displayFont.toLowerCase();
  return (
    lower.includes("great vibes") ||
    lower.includes("homemade apple") ||
    lower.includes("cursive")
  );
}

/** Map TemplateTheme to the AudioPlayer's expected theme shape. */
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
// Reusable animated section wrapper (defined outside render to avoid
// re-creating on every render).
// ---------------------------------------------------------------------------

function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// FAQ Accordion Item
// ---------------------------------------------------------------------------

function FAQAccordionItem({
  faq,
  index,
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
    <div>
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start gap-3 text-left transition-colors items-center"
        style={{
          padding: "18px 20px",
          paddingBottom: isOpen ? 0 : 18,
          background: "transparent",
          border: "none",
        }}
      >
        {/* Question number accent dot */}
        <span
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 0.5,
            color: theme.accent,
            border: `1.5px solid ${theme.accent}`,
            borderRadius: "50%",
            opacity: isOpen ? 1 : 0.5,
            transition: "opacity 0.3s ease",
          }}
        >
          {index + 1}
        </span>

        {/* Question text */}
        <span
          className="flex-1"
          style={{
            fontFamily: theme.bodyFont,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.45,
            color: isOpen ? theme.textPrimary : theme.textSecondary,
            transition: "color 0.3s ease",
          }}
        >
          {faq.question}
        </span>

        {/* Chevron */}
        <motion.span
          className="mt-0.5 flex-shrink-0"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <ChevronDown
            size={16}
            color={theme.accent}
            strokeWidth={2}
            style={{ opacity: isOpen ? 1 : 0.4, transition: "opacity 0.3s ease" }}
          />
        </motion.span>
      </button>

      {/* Answer with AnimatePresence height animation */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.25, delay: 0.05 },
            }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "8px 20px 20px",
                paddingLeft: 48, // align with question text (20px + 20px icon + 8px gap)
              }}
            >
              <p
                style={{
                  fontFamily: theme.bodyFont,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: theme.textSecondary,
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
            margin: "0 20px",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InvitationPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  /** Shared audio ref from the envelope-open playback. */
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
}

export default function InvitationPage({ invitation, theme, audioRef }: InvitationPageProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const nameFontSize = isScriptFont(theme.displayFont) ? 52 : 44;

  return (
    <div style={{ background: theme.bg, color: theme.textPrimary, minHeight: "100dvh" }}>
      {/* ----------------------------------------------------------------- */}
      {/* 1 + 2. Hero (video or image) — full 100dvh                        */}
      {/* When videoUrl is present the couple names float as an overlay.    */}
      {/* When only heroImage is present, names are rendered below in the   */}
      {/* normal document flow (original behaviour).                        */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="relative overflow-hidden"
        style={{ height: invitation.videoUrl ? "100dvh" : 300 }}
      >
        {/* --- Background media ----------------------------------------- */}
        {invitation.videoUrl ? (
          <video
            src={invitation.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img
            src={invitation.heroImage}
            alt="Hero"
            className="h-full w-full object-cover"
          />
        )}

        {/* --- Dark scrim (video only) ----------------------------------- */}
        {invitation.videoUrl && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "rgba(0,0,0,0.42)" }}
          />
        )}

        {/* --- Bottom gradient fading into theme bg --------------------- */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: invitation.videoUrl
              ? `linear-gradient(to bottom, transparent 45%, ${theme.bg} 100%)`
              : `linear-gradient(to bottom, transparent 40%, ${theme.bg} 100%)`,
          }}
        />

        {/* --- Couple names overlay (video mode only) ------------------- */}
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
            {/* Label */}
            <motion.span
              variants={heroTextItem}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: 4,
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Convidam para o casamento de
            </motion.span>

            {/* Bride */}
            <motion.h1
              variants={heroTextItem}
              className="mt-4"
              style={{
                fontFamily: theme.displayFont,
                fontSize: nameFontSize + 8,
                lineHeight: 1.1,
                color: "#ffffff",
                textShadow: "0 2px 32px rgba(0,0,0,0.55)",
              }}
            >
              {invitation.couple.bride}
            </motion.h1>

            {/* Ampersand */}
            <motion.span
              variants={heroTextItem}
              className="my-1"
              style={{
                fontFamily: theme.scriptFont ?? "'Cormorant Garamond', serif",
                fontSize: 36,
                color: "rgba(255,255,255,0.85)",
                textShadow: "0 2px 20px rgba(0,0,0,0.4)",
              }}
            >
              &amp;
            </motion.span>

            {/* Groom */}
            <motion.h1
              variants={heroTextItem}
              style={{
                fontFamily: theme.displayFont,
                fontSize: nameFontSize + 8,
                lineHeight: 1.1,
                color: "#ffffff",
                textShadow: "0 2px 32px rgba(0,0,0,0.55)",
              }}
            >
              {invitation.couple.groom}
            </motion.h1>

            {/* Date pill */}
            <motion.div
              variants={heroTextItem}
              className="mt-6 flex items-center gap-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                letterSpacing: 5,
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 1,
                  background: "rgba(255,255,255,0.45)",
                }}
              />
              {invitation.date.day}&nbsp;&middot;&nbsp;{invitation.date.month}&nbsp;&middot;&nbsp;{invitation.date.year}
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 1,
                  background: "rgba(255,255,255,0.45)",
                }}
              />
            </motion.div>

            {/* Quote */}
            <motion.p
              variants={heroTextItem}
              className="mt-4"
              style={{
                fontFamily: theme.bodyFont,
                fontSize: 14,
                fontStyle: "italic" as const,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.6)",
                maxWidth: 280,
              }}
            >
              {invitation.quote}
            </motion.p>
          </motion.div>
        )}

        {/* --- Audio player floating at the bottom ---------------------- */}
        {invitation.audio.enabled && (
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
            <AudioPlayer
              src={invitation.audio.src}
              title={invitation.audio.title}
              artist={invitation.audio.artist}
              theme={toAudioTheme(theme)}
              externalAudioRef={audioRef}
            />
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Names (shown only when there is NO video)                      */}
      {/* ----------------------------------------------------------------- */}
      {!invitation.videoUrl && (
        <AnimatedSection>
          <div
            className="flex flex-col items-center text-center"
            style={{ padding: "32px 40px" }}
          >
            {/* Label */}
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase" as const,
                color: theme.textSecondary,
              }}
            >
              Convidam para o casamento de
            </span>

            {/* Bride */}
            <h1
              className="mt-4"
              style={{
                fontFamily: theme.displayFont,
                fontSize: nameFontSize,
                lineHeight: 1.15,
                color: theme.textPrimary,
              }}
            >
              {invitation.couple.bride}
            </h1>

            {/* Ampersand */}
            <span
              className="my-1"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                color: theme.accent,
              }}
            >
              &amp;
            </span>

            {/* Groom */}
            <h1
              style={{
                fontFamily: theme.displayFont,
                fontSize: nameFontSize,
                lineHeight: 1.15,
                color: theme.textPrimary,
              }}
            >
              {invitation.couple.groom}
            </h1>

            {/* Divider */}
            <div
              className="mt-6 mb-5"
              style={{
                width: 40,
                height: 1,
                background: theme.accent,
                opacity: 0.38,
              }}
            />

            {/* Quote */}
            <p
              style={{
                fontFamily: theme.bodyFont,
                fontSize: 16,
                fontStyle: "italic" as const,
                lineHeight: 1.6,
                color: theme.textSecondary,
                maxWidth: 300,
              }}
            >
              {invitation.quote}
            </p>
          </div>
        </AnimatedSection>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 3. Date Card                                                      */}
      {/* ----------------------------------------------------------------- */}
      <AnimatedSection className="px-6 pb-8">
        <div
          className="flex flex-col items-center text-center"
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 16,
            padding: 28,
          }}
        >
          {/* Save the date label */}
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 10,
              letterSpacing: 4,
              textTransform: "uppercase" as const,
              color: theme.accent,
            }}
          >
            Save the Date
          </span>

          {/* Day */}
          <span
            className="mt-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 72,
              fontWeight: 300,
              lineHeight: 1,
              color: theme.textPrimary,
            }}
          >
            {invitation.date.day}
          </span>

          {/* Month */}
          <span
            className="mt-1"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 6,
              textTransform: "uppercase" as const,
              color: theme.textSecondary,
            }}
          >
            {invitation.date.month}
          </span>

          {/* Year */}
          <span
            className="mt-1"
            style={{
              fontFamily: theme.bodyFont,
              fontSize: 20,
              color: theme.textSecondary,
            }}
          >
            {invitation.date.year}
          </span>

          {/* Divider */}
          <div
            className="my-4"
            style={{
              width: 100,
              height: 1,
              background: theme.accent,
              opacity: 0.25,
            }}
          />

          {/* Day of week + time */}
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: theme.textSecondary,
            }}
          >
            {invitation.date.dayOfWeek} &middot; {invitation.date.time}
          </span>
        </div>
      </AnimatedSection>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Schedule                                                       */}
      {/* ----------------------------------------------------------------- */}
      {invitation.schedule.length > 0 && (
        <AnimatedSection className="px-6 pb-8">
          <div className="flex flex-col items-center">
            {/* Section label */}
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase" as const,
                color: theme.textSecondary,
              }}
            >
              Programação
            </span>

            {/* Small divider */}
            <div
              className="mt-3 mb-5"
              style={{
                width: 24,
                height: 1,
                background: theme.accent,
                opacity: 0.3,
              }}
            />
          </div>

          {/* Schedule card */}
          <div
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 16,
              overflow: "hidden",
              padding: "20px 0",
            }}
          >
            {invitation.schedule.map((event, i) => (
              <div key={i}>
                {i > 0 && (
                  <div
                    className="mx-5"
                    style={{ height: 1, background: theme.cardBorder }}
                  />
                )}
                <div className="px-5">
                  <ScheduleItem
                    time={event.time}
                    label={event.label}
                    venue={event.venue}
                    accentColor={theme.accent}
                    textColor={theme.textPrimary}
                    venueColor={theme.textSecondary}
                  />
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. Info Cards (Dress Code + Gift Registry)                        */}
      {/* ----------------------------------------------------------------- */}
      <AnimatedSection className="px-6 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {/* Dress Code */}
          <div
            className="flex flex-col items-center gap-2 text-center"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 12,
              padding: "20px 12px",
            }}
          >
            <Shirt size={24} color={theme.accent} strokeWidth={1.5} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase" as const,
                color: theme.textSecondary,
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
              {invitation.dressCode}
            </span>
          </div>

          {/* Gift Registry */}
          <div
            className="flex flex-col items-center gap-2 text-center"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 12,
              padding: "20px 12px",
            }}
          >
            <Gift size={24} color={theme.accent} strokeWidth={1.5} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase" as const,
                color: theme.textSecondary,
              }}
            >
              Lista de Presentes
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
          </div>
        </div>
      </AnimatedSection>

        {/* ----------------------------------------------------------------- */}
        {/* 6. CTA Section                                                    */}
        {/* ----------------------------------------------------------------- */}
        <AnimatedSection className="px-6 pb-8">
            <div className="flex flex-col items-center">
                {/* Label */}
                <span
                    className="mb-5"
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10,
                        letterSpacing: 3,
                        textTransform: "uppercase" as const,
                        color: theme.textSecondary,
                    }}
                >
            Confirme sua presença
          </span>

                {/* Buttons */}
                <div className="flex w-full flex-col gap-3">
                    {/* Primary — Ver Localização */}
                    <a
                        href={invitation.location.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-opacity hover:opacity-90"
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            background: theme.ctaPrimaryBg,
                            color: theme.ctaPrimaryText,
                            borderRadius: theme.ctaRadius,
                        }}
                    >
                        <MapPin size={18} />
                        Ver Localização
                    </a>

                    {/* Secondary — Confirmar Presença */}
                    <button
                        onClick={() => setRsvpOpen(true)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-opacity hover:opacity-90"
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            background: "transparent",
                            border: `1.5px solid ${theme.ctaSecondaryBorder}`,
                            color: theme.ctaSecondaryText,
                            borderRadius: theme.ctaRadius,
                        }}
                    >
                        <Heart size={18} />
                        Confirmar Presença
                    </button>
                </div>
            </div>
        </AnimatedSection>

      {/* ----------------------------------------------------------------- */}
      {/* 5b. FAQs                                                          */}
      {/* ----------------------------------------------------------------- */}
      {invitation.faqs && invitation.faqs.length > 0 && (
        <AnimatedSection className="px-6 pb-8">
          <div className="flex flex-col items-center">
            {/* Section label */}
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase" as const,
                color: theme.textSecondary,
              }}
            >
              Perguntas Frequentes
            </span>

            {/* Small divider */}
            <div
              className="mt-3 mb-5"
              style={{
                width: 24,
                height: 1,
                background: theme.accent,
                opacity: 0.3,
              }}
            />
          </div>

          {/* FAQ card */}
          <div
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {invitation.faqs.map((faq, i) => (
              <FAQAccordionItem
                key={i}
                faq={faq}
                index={i}
                isOpen={openFaqIndex === i}
                onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                theme={theme}
                isLast={i === (invitation.faqs?.length ?? 0) - 1}
              />
            ))}
          </div>
        </AnimatedSection>
      )}



      {/* ----------------------------------------------------------------- */}
      {/* 7. Footer                                                         */}
      {/* ----------------------------------------------------------------- */}
      <AnimatedSection>
        <footer className="flex flex-col items-center pb-10 pt-4">
          {/* Divider */}
          <div
            className="mb-5"
            style={{
              width: 40,
              height: 1,
              background: theme.accent,
              opacity: 0.2,
            }}
          />

          {/* Monogram */}
          <span
            style={{
              fontFamily: theme.displayFont,
              fontSize: 20,
              color: theme.textMuted,
            }}
          >
            {invitation.couple.monogram}
          </span>

          {/* Date */}
          <span
            className="mt-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              letterSpacing: 2,
              color: theme.textMuted,
            }}
          >
            {invitation.date.day} &middot; {invitation.date.month} &middot; {invitation.date.year}
          </span>
        </footer>
      </AnimatedSection>

      {/* ----------------------------------------------------------------- */}
      {/* RSVP Modal                                                        */}
      {/* ----------------------------------------------------------------- */}
      <RSVPModal
        open={rsvpOpen}
        onClose={() => setRsvpOpen(false)}
        invitation={invitation}
        theme={theme}
      />
    </div>
  );
}
