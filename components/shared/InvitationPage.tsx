"use client";

import { useState, type MutableRefObject } from "react";
import { motion, type Variants } from "framer-motion";
import { CalendarPlus, MapPin, Heart, Shirt, Gift } from "lucide-react";

import type { InvitationData, TemplateTheme } from "@/lib/types";
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

  const nameFontSize = isScriptFont(theme.displayFont) ? 52 : 44;

  return (
    <div style={{ background: theme.bg, color: theme.textPrimary, minHeight: "100dvh" }}>
      {/* ----------------------------------------------------------------- */}
      {/* 1. Hero Image                                                     */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative" style={{ height: 300 }}>
        <img
          src={invitation.heroImage}
          alt="Hero"
          className="h-full w-full object-cover"
        />

        {/* Gradient overlay fading to bg */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 40%, ${theme.bg} 100%)`,
          }}
        />

        {/* Audio player floating at the bottom */}
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
      {/* 2. Names                                                          */}
      {/* ----------------------------------------------------------------- */}
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
                fontSize: 15,
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
                fontSize: 15,
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

            {/* Outline — Adicionar ao Calendário */}
            <button
              className="flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                fontFamily: "'Inter', sans-serif",
                background: "transparent",
                border: `1px solid ${theme.cardBorder}`,
                color: theme.textSecondary,
                borderRadius: theme.ctaRadius,
              }}
            >
              <CalendarPlus size={18} />
              Adicionar ao Calendário
            </button>
          </div>
        </div>
      </AnimatedSection>

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
