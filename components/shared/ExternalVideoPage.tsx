"use client";

/* ------------------------------------------------------------------ */
/*  ExternalVideoPage                                                   */
/*                                                                      */
/*  Hero-only video invitation — shared hero text/media plus CTA.       */
/*  Fixed RSVP/calendar button opens the shared RSVP flow.              */
/* ------------------------------------------------------------------ */

import {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, Heart } from "lucide-react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import RSVPModal from "@/components/shared/RSVPModal";
import DynamicFontLoader from "@/components/shared/DynamicFontLoader";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";
import { getRsvpCtaAction } from "@/lib/rsvp-config";
import { useCustomText } from "@/lib/custom-texts";
import InvitationHero from "./InvitationHero";
import CalendarButton from "./CalendarButton";

export interface ExternalVideoPageHandle {
  play: () => void;
}

function readRsvpSubmitted(slug: string, isCalendarCta: boolean): boolean {
  if (isCalendarCta || typeof window === "undefined") return false;
  try {
    const slugs: string[] = JSON.parse(
      localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
    );
    return slugs.includes(slug);
  } catch {
    return false;
  }
}

interface ExternalVideoPageProps {
  videoUrl: string;
  videoPoster?: string;
  /** When false the wrapper is invisible but still mounted (preloading). */
  visible?: boolean;
  /** Admin preview uses the hero's normal autoplay behavior. */
  autoPlay?: boolean;
  invitation: InvitationData;
  theme: TemplateTheme;
}

const ExternalVideoPage = forwardRef<
  ExternalVideoPageHandle,
  ExternalVideoPageProps
>(function ExternalVideoPage(
  {
    videoUrl,
    videoPoster,
    visible = true,
    autoPlay = false,
    invitation,
    theme,
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const isCalendarCta = getRsvpCtaAction(invitation.rsvp) === "calendar";
  const [rsvpSubmitted, setRsvpSubmitted] = useState(() =>
    readRsvpSubmitted(invitation.slug, isCalendarCta),
  );
  const t = useCustomText(invitation.customTexts);
  const heroInvitation =
    invitation.videoUrl === videoUrl && invitation.videoPoster === videoPoster
      ? invitation
      : { ...invitation, videoUrl, videoPoster };

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    play() {
      const v = videoRef.current;
      if (!v) return;
      v.play().catch(() => {
        v.muted = true;
        v.play().catch(() => {});
      });
      // Show the RSVP button 4 seconds after playback starts
      timerRef.current = setTimeout(() => setButtonVisible(true), 4000);
    },
  }));

  return (
    <>
      <DynamicFontLoader theme={theme} />
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          zIndex: 50,
          overflow: "hidden",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.8s ease",
        }}
      >
        <InvitationHero
          invitation={heroInvitation}
          theme={theme}
          videoRef={videoRef}
          autoPlay={autoPlay}
          animateHeroText
        />

        {/* Fixed RSVP button — slides up 4 s after video starts */}
        <AnimatePresence>
          {visible && buttonVisible && (
            <motion.div
              key="rsvp-bar"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "24px 24px max(24px, env(safe-area-inset-bottom))",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
                display: "flex",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              {isCalendarCta ? (
                <CalendarButton
                  date={invitation.date}
                  location={invitation.location}
                  couple={invitation.couple}
                  eventType={invitation.eventType}
                  className="active:scale-[0.96] transition-transform"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 32px",
                    borderRadius: theme.ctaRadius ?? "9999px",
                    background: theme.ctaPrimaryBg,
                    color: theme.ctaPrimaryText,
                    fontFamily: theme.uiFont,
                    fontSize: "15px",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                    width: "100%",
                    maxWidth: "360px",
                    justifyContent: "center",
                  }}
                >
                  <CalendarPlus size={17} strokeWidth={1.5} />
                  {t("cta_addToCalendar")}
                </CalendarButton>
              ) : (
                <button
                  onClick={() => {
                    if (!rsvpSubmitted) setRsvpOpen(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 32px",
                    borderRadius: theme.ctaRadius ?? "9999px",
                    background: rsvpSubmitted ? "#22c55e" : theme.ctaPrimaryBg,
                    color: rsvpSubmitted ? "#fff" : theme.ctaPrimaryText,
                    fontFamily: theme.uiFont,
                    fontSize: "15px",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    border: "none",
                    cursor: rsvpSubmitted ? "default" : "pointer",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                    width: "100%",
                    maxWidth: "360px",
                    justifyContent: "center",
                  }}
                >
                  <Heart size={17} strokeWidth={1.5} />
                  {rsvpSubmitted
                    ? t("cta_confirmedButton")
                    : t("cta_confirmButton")}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RSVP modal — rendered outside the fixed video container */}
      {!isCalendarCta && (
        <RSVPModal
          open={rsvpOpen}
          onClose={() => {
            setRsvpOpen(false);
            setRsvpSubmitted(readRsvpSubmitted(invitation.slug, isCalendarCta));
          }}
          invitation={invitation}
          theme={theme}
          customTexts={invitation.customTexts}
        />
      )}
    </>
  );
});

export default ExternalVideoPage;
