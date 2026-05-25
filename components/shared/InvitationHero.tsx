"use client";

import { type MutableRefObject, type RefObject } from "react";
import { motion, type Variants } from "framer-motion";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { type ResolvedTextStyles, resolveTextStyles } from "@/lib/text-styles";
import { getImageStyle } from "@/lib/image-settings";
import { t } from "@/lib/custom-texts";
import { isWeddingEventType } from "@/lib/invitation-event-types";
import { scrollToNextHeroSection } from "@/lib/curtain-canva";
import AudioPlayer from "./AudioPlayer";
import { PrefetchedVideoSlot } from "./PrefetchedVideoSlot";
import { EditableText } from "./EditableText";

// ---------------------------------------------------------------------------
// Animation variants used by the hero
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

const namesFadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_IMAGE_HERO_HEIGHT = 300;

/** Default opacity for the dark scrim shown over hero videos. */
export const DEFAULT_HERO_SCRIM_OPACITY = 0.38;
/**
 * Default percent at which the bottom gradient starts fading into the theme
 * background. Differs slightly between video and image heroes.
 */
export const DEFAULT_HERO_GRADIENT_START_VIDEO = 40;
export const DEFAULT_HERO_GRADIENT_START_IMAGE = 35;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getHeroSectionHeight(
  invitation: Pick<InvitationData, "videoUrl" | "heroHeight">,
): "100dvh" | number {
  return invitation.videoUrl
    ? "100dvh"
    : invitation.heroHeight ?? DEFAULT_IMAGE_HERO_HEIGHT;
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
// InvitationHero — the hero <section> (video or image background + overlay)
// ---------------------------------------------------------------------------

interface InvitationHeroProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  prefetchedVideoRef?: RefObject<HTMLVideoElement | null>;
  /** Tracked by the consuming page (used to wire audio analytics). */
  onAudioPlay?: () => void;
}

export default function InvitationHero({
  invitation,
  theme,
  audioRef,
  prefetchedVideoRef,
  onAudioPlay,
}: InvitationHeroProps) {
  const ts: ResolvedTextStyles = resolveTextStyles(theme, invitation.textStyles);
  const isWedding = isWeddingEventType(invitation.eventType);

  const scrimOpacity = clamp(
    invitation.heroOverlay?.scrimOpacity ?? DEFAULT_HERO_SCRIM_OPACITY,
    0,
    1,
  );
  const gradientStart = clamp(
    invitation.heroOverlay?.gradientStart ??
      (invitation.videoUrl
        ? DEFAULT_HERO_GRADIENT_START_VIDEO
        : DEFAULT_HERO_GRADIENT_START_IMAGE),
    0,
    100,
  );

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: getHeroSectionHeight(invitation) }}
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
          style={getImageStyle(invitation.imageSettings, "heroImage")}
        />
      )}

      {/* Dark scrim (video only) */}
      {invitation.videoUrl && scrimOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `rgba(0,0,0,${scrimOpacity})` }}
        />
      )}

      {/* Bottom gradient fading into theme bg */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent ${gradientStart}%, ${theme.bg} 100%)`,
        }}
      />

      {/* Couple names overlay (video mode) */}
      {invitation.videoUrl && (
        <motion.div
          variants={heroTextContainer}
          initial="hidden"
          animate="visible"
          className="absolute inset-x-0 flex flex-col items-center text-center mt-16"
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
              <motion.h1 variants={heroTextItem} style={ts.coupleNamesVideo}>
                <EditableText elementKey="coupleNames">
                  {invitation.couple.bride}
                </EditableText>
              </motion.h1>

              {isWedding && (
                <>
                  <motion.span
                    variants={heroTextItem}
                    className="my-2"
                    style={ts.ampersandVideo}
                  >
                    <EditableText elementKey="ampersand">&amp;</EditableText>
                  </motion.span>

                  <motion.h1
                    variants={heroTextItem}
                    style={ts.coupleNamesVideo}
                  >
                    <EditableText elementKey="coupleNames">
                      {invitation.couple.groom}
                    </EditableText>
                  </motion.h1>
                </>
              )}

              {/* Blessing message */}
              <motion.span
                variants={heroTextItem}
                className="mt-5"
                style={ts.blessingMessageVideo}
              >
                <EditableText elementKey="blessingMessage">
                  {invitation.parents.blessingMessage}
                </EditableText>
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
                    <span style={ts.parentsNamesVideo}>
                      <EditableText elementKey="parentsNames">
                        {invitation.parents.bridesFather}
                      </EditableText>
                    </span>
                  )}
                  {invitation.parents.bridesMother && (
                    <span style={ts.parentsNamesVideo}>
                      <EditableText elementKey="parentsNames">
                        {invitation.parents.bridesMother}
                      </EditableText>
                    </span>
                  )}
                </div>
                <div
                  className="flex flex-col items-end gap-0.5"
                  style={{ textAlign: "right" }}
                >
                  {invitation.parents.groomsFather && (
                    <span style={ts.parentsNamesVideo}>
                      <EditableText elementKey="parentsNames">
                        {invitation.parents.groomsFather}
                      </EditableText>
                    </span>
                  )}
                  {invitation.parents.groomsMother && (
                    <span style={ts.parentsNamesVideo}>
                      <EditableText elementKey="parentsNames">
                        {invitation.parents.groomsMother}
                      </EditableText>
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Invite message */}
              <motion.p
                variants={heroTextItem}
                className="mt-5"
                style={{
                  ...ts.inviteMessageVideo,
                  maxWidth: 300,
                  textAlign: "center",
                }}
              >
                <EditableText elementKey="inviteMessage">
                  {invitation.parents.inviteMessage}
                </EditableText>
              </motion.p>
            </>
          ) : (
            /* ── Standard Mode (video) ── */
            <>
              {/* Bride */}
              <motion.h1
                variants={heroTextItem}
                className="mt-5"
                style={ts.coupleNamesVideo}
              >
                <EditableText elementKey="coupleNames">
                  {invitation.couple.bride}
                </EditableText>
              </motion.h1>

              {/* Ampersand */}
              {isWedding && (
                <>
                  <motion.span
                    variants={heroTextItem}
                    className="my-2"
                    style={ts.ampersandVideo}
                  >
                    <EditableText elementKey="ampersand">&amp;</EditableText>
                  </motion.span>

                  {/* Groom */}
                  <motion.h1
                    variants={heroTextItem}
                    style={ts.coupleNamesVideo}
                  >
                    <EditableText elementKey="coupleNames">
                      {invitation.couple.groom}
                    </EditableText>
                  </motion.h1>
                </>
              )}

              {/* Label */}
              <motion.span
                variants={heroTextItem}
                style={ts.inviteLabelVideo}
                className="mt-7"
              >
                <EditableText elementKey="inviteLabel">
                  {t(invitation.customTexts, "hero_inviteLabel")}
                </EditableText>
              </motion.span>

              {/* Quote */}
              <motion.p
                variants={heroTextItem}
                className="mt-5"
                style={{
                  ...ts.quoteVideo,
                  maxWidth: 280,
                  whiteSpace: "pre-line",
                }}
              >
                <EditableText elementKey="quote">
                  {invitation.quote}
                </EditableText>
              </motion.p>
            </>
          )}
        </motion.div>
      )}

      {/* Animated scroll-down indicator (above audio player) */}
      {invitation.heroScrollIndicator?.enabled && (
        <motion.button
          type="button"
          aria-label="Scroll to next section"
          onClick={() => scrollToNextHeroSection()}
          className="absolute left-1/2 z-20 flex h-12 w-12 -translate-x-1/2 items-center justify-center transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            bottom: invitation.audio.enabled
              ? "calc(env(safe-area-inset-bottom) + 6rem)"
              : "calc(env(safe-area-inset-bottom) + 2rem)",
            color: invitation.heroScrollIndicator.color || theme.textPrimary,
            cursor: "pointer",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: [0, 9, 0] }}
          transition={{
            opacity: { delay: 0.8, duration: 0.35 },
            y: {
              delay: 1,
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.button>
      )}

      {/* Audio player */}
      {invitation.audio.enabled && (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
          <AudioPlayer
            src={invitation.audio.src}
            title={invitation.audio.title}
            artist={invitation.audio.artist}
            theme={toAudioTheme(theme)}
            titleStyle={ts.audioTitle}
            artistStyle={ts.audioArtist}
            externalAudioRef={audioRef}
            onPlay={onAudioPlay}
          />
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// InvitationHeroNames — the names / quote / parents fallback block shown
// below the hero when there is NO videoUrl (i.e. image hero).
// ---------------------------------------------------------------------------

interface InvitationHeroNamesProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  isPreview?: boolean;
}

export function InvitationHeroNames({
  invitation,
  theme,
  isPreview = false,
}: InvitationHeroNamesProps) {
  if (invitation.videoUrl) return null;

  const ts = resolveTextStyles(theme, invitation.textStyles);
  const isWedding = isWeddingEventType(invitation.eventType);

  return (
    <motion.section
      variants={namesFadeInUp}
      initial="hidden"
      {...(isPreview
        ? { animate: "visible" }
        : {
            whileInView: "visible",
            viewport: { once: true, margin: "-60px" },
          })}
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ padding: "36px 40px" }}
      >
        {invitation.parents?.enabled ? (
          /* ── Parents Mode (image hero) ── */
          <>
            {/* Couple names */}
            <h1 className="mt-2" style={ts.coupleNames}>
              <EditableText elementKey="coupleNames">
                {invitation.couple.bride}
              </EditableText>
            </h1>

            {isWedding && (
              <>
                <span className="my-2" style={ts.ampersand}>
                  <EditableText elementKey="ampersand">&amp;</EditableText>
                </span>

                <h1 style={ts.coupleNames}>
                  <EditableText elementKey="coupleNames">
                    {invitation.couple.groom}
                  </EditableText>
                </h1>
              </>
            )}

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
                background: ts.accent,
                opacity: 0.3,
              }}
            />

            {/* Blessing message */}
            <p style={ts.blessingMessage}>
              <EditableText elementKey="blessingMessage">
                {invitation.parents.blessingMessage}
              </EditableText>
            </p>

            {/* Parents names — two columns */}
            <div className="mt-5 flex w-full max-w-xs justify-between gap-4">
              <div className="flex flex-col items-start gap-0.5">
                {invitation.parents.bridesFather && (
                  <span
                    style={{
                      ...ts.parentsNames,
                      textAlign: "left",
                    }}
                  >
                    <EditableText elementKey="parentsNames">
                      {invitation.parents.bridesFather}
                    </EditableText>
                  </span>
                )}
                {invitation.parents.bridesMother && (
                  <span
                    style={{
                      ...ts.parentsNames,
                      textAlign: "left",
                    }}
                  >
                    <EditableText elementKey="parentsNames">
                      {invitation.parents.bridesMother}
                    </EditableText>
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {invitation.parents.groomsFather && (
                  <span
                    style={{
                      ...ts.parentsNames,
                      textAlign: "right",
                    }}
                  >
                    <EditableText elementKey="parentsNames">
                      {invitation.parents.groomsFather}
                    </EditableText>
                  </span>
                )}
                {invitation.parents.groomsMother && (
                  <span
                    style={{
                      ...ts.parentsNames,
                      textAlign: "right",
                    }}
                  >
                    <EditableText elementKey="parentsNames">
                      {invitation.parents.groomsMother}
                    </EditableText>
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
                background: ts.accent,
                opacity: 0.3,
              }}
            />

            {/* Invite message */}
            <p
              style={{
                ...ts.inviteMessage,
                maxWidth: 300,
              }}
            >
              <EditableText elementKey="inviteMessage">
                {invitation.parents.inviteMessage}
              </EditableText>
            </p>
          </>
        ) : (
          /* ── Standard Mode (image hero) ── */
          <>
            <p
              style={{
                ...ts.quote,
                maxWidth: 300,
              }}
            >
              <EditableText elementKey="quote">{invitation.quote}</EditableText>
            </p>

            <h1 className="mt-5" style={ts.coupleNames}>
              <EditableText elementKey="coupleNames">
                {invitation.couple.bride}
              </EditableText>
            </h1>

            {isWedding && (
              <>
                <span className="my-2" style={ts.ampersand}>
                  <EditableText elementKey="ampersand">&amp;</EditableText>
                </span>

                <h1 style={ts.coupleNames}>
                  <EditableText elementKey="coupleNames">
                    {invitation.couple.groom}
                  </EditableText>
                </h1>
              </>
            )}

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
                background: ts.accent,
                opacity: 0.3,
              }}
            />

            <span style={ts.inviteLabel}>
              <EditableText elementKey="inviteLabel">
                {t(invitation.customTexts, "hero_inviteLabel")}
              </EditableText>
            </span>
          </>
        )}
      </div>
    </motion.section>
  );
}
