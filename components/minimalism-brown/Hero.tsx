"use client";

import type { CSSProperties, MutableRefObject } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbStyle, mbTokens } from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import { isWeddingEventType } from "@/lib/invitation-event-types";
import { resolveTextStyles } from "@/lib/text-styles";
import HeroTextOverlay from "@/components/shared/HeroTextOverlay";
import { EASE } from "@/components/shared/animations";
import { EditableText } from "@/components/shared/EditableText";
import Polaroid from "./Polaroid";
import AudioPlayer from "@/components/shared/AudioPlayer";
import { HouseBackdrop, Sprig } from "./Decor";
import { useIdle, useMbMotion } from "./motion";

/**
 * Opening block: a tracked eyebrow, the two names split by a script
 * ampersand, and the taped polaroid with a sprig tucked at its foot.
 *
 * Sizes mirror the reference; every value routes through the theme so a
 * palette or font change in the admin moves the whole hero.
 *
 * The hero animates on mount rather than on scroll — it is already in view
 * when the envelope opens, so a scroll-triggered reveal would never fire.
 */
export default function Hero({
  invitation,
  theme,
  audioRef,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const ct = useCustomText(invitation.customTexts);
  // Only a wedding pairs two names. A baptism or anniversary has one
  // honouree, and showing "&" plus a second name invents a person.
  const isWedding = isWeddingEventType(invitation.eventType);
  // The free-text layer is hero media furniture, so it belongs on the
  // still-image hero too — not only the video path.
  const hideDefaultText = invitation.heroTextLayer?.hideDefaultText === true;
  const resolved = resolveTextStyles(theme, ts);
  const { instant, reduced } = useMbMotion();
  const still = instant || reduced;

  // Only a vertical drift. An added rotation here inflates the polaroid's
  // bounding box and stacks on top of the tilt already painted into the frame
  // artwork, leaving the photo at a visibly different angle to the reference.
  const { scrollY } = useScroll();
  const lift = useTransform(scrollY, [0, 420], [0, -18]);

  const ampIdle = useIdle("breathe", 0, 5.5);

  /** Mount-in props for the hero's own stacked lines. */
  const enter = (delay: number) =>
    still
      ? {}
      : ({
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, ease: EASE, delay },
        } as const);

  const eyebrow: CSSProperties = {
    margin: 0,
    textAlign: "center",
    fontFamily: t.eyebrow.font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "2.08px",
    textTransform: "uppercase",
    color: t.heroText,
  };

  const name: CSSProperties = {
    margin: 0,
    // The hero names are the body serif in italic at 32.76px — EB Garamond
    // upright is the announcement block further down, not this one.
    fontFamily: theme.bodyFont,
    fontSize: 32.76,
    fontWeight: 300,
    fontStyle: "italic",
    lineHeight: 1.15,
    color: t.heroText,
  };

  const amp: CSSProperties = {
    fontFamily: theme.scriptFont ?? theme.displayFont,
    fontSize: 42,
    fontWeight: 300,
    lineHeight: 1,
    color: theme.textSecondary,
  };

  return (
    <header
      style={{
        position: "relative",
        // HeroTextOverlay sizes its blocks in `cqw`, which resolve against the
        // nearest inline-size container — without this they collapse.
        containerType: "inline-size",
        // Reference: 48px 16px 80px.
        padding: "48px 16px 80px",
      }}
    >
      <HouseBackdrop top="42%" />
      {/* The free-text layer can replace the built-in hero text, same as on
          the video hero. */}
      {!hideDefaultText && (
        <>
        <motion.p style={mbStyle(eyebrow, ts, "mbEyebrow")} {...enter(0.05)}>
          <EditableText elementKey="mbEyebrow">
            {ct("mb_heroEyebrow")}
          </EditableText>
        </motion.p>

        <motion.h1
          style={{
            margin: `${t.gap.row}px 0 0`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
          {...enter(0.18)}
        >
          <span style={mbStyle(name, ts, "mbNames")}>
            <EditableText elementKey="mbNames">
              {invitation.couple.groom}
            </EditableText>
          </span>
          {isWedding && (
            <>
              <span
                aria-hidden
                style={{
                  ...mbStyle(amp, ts, "mbAmpersand"),
                  display: "inline-block",
                  ...ampIdle,
                }}
              >
                &amp;
              </span>
              <span style={mbStyle(name, ts, "mbNames")}>
                <EditableText elementKey="mbNames">
                  {invitation.couple.bride}
                </EditableText>
              </span>
            </>
          )}
        </motion.h1>
        </>
      )}

      <motion.div
        style={{
          position: "relative",
          marginTop: t.gap.block,
          ...(still ? {} : { y: lift }),
        }}
        {...(still
          ? {}
          : {
              initial: { opacity: 0, scale: 0.94 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.9, ease: EASE, delay: 0.3 },
            })}
      >
        <Polaroid
          fit={invitation.heroMediaFit ?? undefined}
          src={invitation.heroImage}
          alt={
            isWedding
              ? `${invitation.couple.groom} & ${invitation.couple.bride}`
              : invitation.couple.groom
          }
          theme={theme}
        />
        <Sprig
          theme={theme}
          width={134}
          flip
          index={1}
          layer={30}
          style={{
            position: "absolute",
            left: 17,
            bottom: "-6%",
          }}
        />
      </motion.div>

      {/* Only InvitationHero rendered this, which this template doesn't use —
          so background music played here with no way to pause it. */}
      {invitation.audio?.enabled && (invitation.audio.visibility ?? true) && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: t.gap.block,
            position: "relative",
            zIndex: 2,
          }}
        >
          <AudioPlayer
            audio={invitation.audio}
            theme={theme}
            externalAudioRef={audioRef}
          />
        </div>
      )}
      {/* Free-positioned custom text, the same layer the video hero renders.
          No videoRef here: its timing options key off a video's playback, and
          a still-image hero has none, so blocks show immediately. */}
      <HeroTextOverlay
        layer={invitation.heroTextLayer}
        fonts={{
          display: resolved.displayFont,
          body: resolved.bodyFont,
          script: resolved.scriptFont,
          ui: resolved.uiFont,
        }}
        play={!reduced}
      />

    </header>
  );
}
