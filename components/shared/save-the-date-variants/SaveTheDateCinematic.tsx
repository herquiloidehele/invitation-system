"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { EditableText } from "@/components/shared/EditableText";
import { EASE, WordReveal } from "@/components/shared/animations";
import { getImageStyle } from "@/lib/image-settings";
import { t } from "@/lib/custom-texts";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import { CalendarCTA } from "./SaveTheDateShared";
import type { SaveTheDateVariantProps } from "./types";

const CINEMATIC_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80&fit=crop";

// ---------------------------------------------------------------------------
// 4. Cinematic Banner — full-bleed image top half + frosted date ribbon
// ---------------------------------------------------------------------------

export default function SaveTheDateCinematic({
  invitation,
  theme,
  ts,
  cardBorderRadius,
  onCalendarClick,
  imageSettings,
  customTexts: ct,
  isPreview,
}: SaveTheDateVariantProps) {
  const bgImage =
    invitation.cinematicImageUrl?.trim() || CINEMATIC_DEFAULT_IMAGE;
  const cinematicImgStyle = getImageStyle(imageSettings, "cinematicImage");
  const displayName = buildInvitationDisplayName({
    eventType: invitation.eventType,
    primaryName: invitation.couple.bride,
    secondaryName: invitation.couple.groom,
  });

  return (
    <motion.div
      className="relative flex flex-col items-center overflow-hidden"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        borderRadius: cardBorderRadius ?? 20,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.08)",
      }}
    >
      {/* Top half — full-bleed photo with overlay */}
      <div
        className="relative w-full flex flex-col items-center justify-end overflow-hidden"
        style={{ minHeight: 220 }}
      >
        {/* Background image — rendered via next/image so it gets WebP
            transcoding, responsive `srcset`, and CDN-friendly optimisation
            instead of shipping the original asset bytes. The
            `cinematicImgStyle` admin overrides are forwarded as inline
            CSS (objectPosition / transform) on the underlying <img>. */}
        <motion.div
          initial={{ scale: 1.06, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 1.4, ease: EASE }}
          style={{
            position: "absolute",
            inset: 0,
            ...(cinematicImgStyle.transform
              ? {
                  transform: cinematicImgStyle.transform,
                  transformOrigin:
                    cinematicImgStyle.transformOrigin as string,
                }
              : {}),
          }}
        >
          <Image
            src={bgImage}
            alt=""
            aria-hidden
            fill
            // Invitation column caps at 500 px; cinematic variant fills it.
            sizes="(max-width: 500px) 100vw, 500px"
            priority={false}
            style={{
              objectFit: "cover",
              objectPosition:
                (cinematicImgStyle.objectPosition as string | undefined) ??
                "center",
            }}
          />
        </motion.div>

        {/* Dark gradient overlay — heavier at bottom for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.72) 100%)",
          }}
        />

        {/* Thin accent bar at the very top */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 1.2, ease: EASE }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${ts.accent}, transparent)`,
            opacity: 0.7,
          }}
        />

        {/* Content sits above the overlay */}
        <div
          className="relative z-10 flex flex-col items-center w-full"
          style={{ padding: "28px 24px 28px" }}
        >
          {/* "Save the Date" label — white on dark image */}
          <span style={ts.cinematicSaveLabel}>
            <EditableText elementKey="cinematicSaveLabel">
              <WordReveal
                text={t(ct, "saveDate_label")}
                isPreview={isPreview}
              />
            </EditableText>
          </span>

          {/* Script couple names */}
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 1, delay: 0.25, ease: EASE }}
            className="mt-3 text-center"
            style={ts.cinematicCouple}
          >
            <EditableText elementKey="cinematicCouple">
              {displayName}
            </EditableText>
          </motion.span>

          {/* Thin accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 1, delay: 0.45, ease: EASE }}
            className="mt-4"
            style={{
              width: 80,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            }}
          />
        </div>
      </div>

      {/* Bottom ribbon — frosted glass date bar */}
      <div
        className="w-full"
        style={{
          background: theme.cardBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: `1px solid ${theme.cardBorder}`,
          padding: "20px 24px",
        }}
      >
        {/* Horizontal date ribbon */}
        <div className="flex items-center justify-center gap-4">
          <span style={ts.cinematicDay}>
            <EditableText elementKey="cinematicDay">
              {invitation.date.day}
            </EditableText>
          </span>

          <div
            style={{
              width: 1,
              height: 36,
              background: ts.accent,
              opacity: 0.25,
            }}
          />

          <div className="flex flex-col items-center gap-0.5">
            <span style={ts.cinematicMonth}>
              <EditableText elementKey="cinematicMonth">
                {invitation.date.month}
              </EditableText>
            </span>
            <span style={ts.cinematicYear}>
              <EditableText elementKey="cinematicYear">
                {invitation.date.year}
              </EditableText>
            </span>
          </div>

          <div
            style={{
              width: 1,
              height: 36,
              background: ts.accent,
              opacity: 0.25,
            }}
          />

          <div className="flex flex-col items-center gap-0.5">
            <span style={ts.cinematicDayOfWeek}>
              <EditableText elementKey="cinematicDayOfWeek">
                {invitation.date.dayOfWeek}
              </EditableText>
            </span>
            <span style={ts.cinematicTime}>
              <EditableText elementKey="cinematicTime">
                {invitation.date.time}
              </EditableText>
            </span>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <CalendarCTA
            invitation={invitation}
            ts={ts}
            onCalendarClick={onCalendarClick}
            customTexts={ct}
          />
        </div>
      </div>
    </motion.div>
  );
}
