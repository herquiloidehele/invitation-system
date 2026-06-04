"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  computeCountdownTimeLeft,
  type CountdownTimeLeft,
  formatCountdownValue,
} from "@/lib/countdown";
import { getBackgroundImageStyle } from "@/lib/image-settings";
import { resolveTextStyles } from "@/lib/text-styles";
import type { InvitationData, TemplateTheme } from "@/lib/types";

import { EditableText } from "./EditableText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const DEFAULT_TITLE = "Contagem Decrescente";
const DEFAULT_SUBTITLE = "Até ao nosso grande dia";
const DEFAULT_DAYS = "DIAS";
const DEFAULT_HOURS = "HORAS";
const DEFAULT_MINUTES = "MINUTOS";
const DEFAULT_SECONDS = "SEGUNDOS";

interface ExternalCountdownSectionProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

export default function ExternalCountdownSection({
  invitation,
  theme,
}: ExternalCountdownSectionProps) {
  const config = invitation.countdown;
  const ts = resolveTextStyles(theme, invitation.textStyles);
  const [timeLeft, setTimeLeft] = useState<CountdownTimeLeft | null>(null);

  useEffect(() => {
    const updateTimeLeft = () => {
      setTimeLeft(
        computeCountdownTimeLeft(invitation.date.iso, invitation.date.time),
      );
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [invitation.date.iso, invitation.date.time]);

  if (!config?.enabled) return null;

  const backgroundColor = config.backgroundColor || theme.bg;
  const cardBg = config.cardBg || "rgba(255, 252, 244, 0.72)";
  const cardBorder = config.cardBorder || theme.cardBorder;
  const cardBorderRadius = config.cardBorderRadius ?? 12;
  const hasBackgroundImage =
    typeof config.backgroundImage === "string" &&
    config.backgroundImage.trim() !== "";
  const backgroundImageStyle = hasBackgroundImage
    ? getBackgroundImageStyle(invitation.imageSettings, "countdownBackground")
    : {};
  const backgroundScrimOpacity = Math.min(
    1,
    Math.max(0, config.backgroundScrimOpacity ?? 0.45),
  );
  const displayTimeLeft = timeLeft ?? {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
  const isCelebration =
    timeLeft !== null &&
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  const units = [
    { value: displayTimeLeft.days, label: config.daysLabel || DEFAULT_DAYS },
    { value: displayTimeLeft.hours, label: config.hoursLabel || DEFAULT_HOURS },
    {
      value: displayTimeLeft.minutes,
      label: config.minutesLabel || DEFAULT_MINUTES,
    },
    {
      value: displayTimeLeft.seconds,
      label: config.secondsLabel || DEFAULT_SECONDS,
    },
  ];

  return (
    <section
      className="relative overflow-hidden px-6 py-16 sm:py-20"
      style={{
        backgroundColor,
        color: theme.textPrimary,
      }}
    >
      {hasBackgroundImage && (
        <>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${config.backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              ...backgroundImageStyle,
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: `rgba(0,0,0,${backgroundScrimOpacity})` }}
          />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 mx-auto flex max-w-[680px] flex-col items-center text-center"
      >
        <h2 style={ts.externalCountdownTitle}>
          <EditableText elementKey="externalCountdownTitle">
            {config.title || DEFAULT_TITLE}
          </EditableText>
        </h2>

        <p className="mt-2" style={ts.externalCountdownSubtitle}>
          <EditableText elementKey="externalCountdownSubtitle">
            {config.subtitle || DEFAULT_SUBTITLE}
          </EditableText>
        </p>

        {isCelebration ? (
          <div
            className="mt-12 rounded-3xl px-8 py-10"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <p style={ts.externalCountdownCelebrationTitle}>
              <EditableText elementKey="externalCountdownCelebrationTitle">
                Hoje é o grande dia!
              </EditableText>
            </p>
          </div>
        ) : (
          <div className="mt-12 grid w-full grid-cols-2 gap-3">
            {units.map((unit, index) => (
              <motion.div
                key={unit.label}
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.06, ease: EASE }}
                className="flex min-h-[120px] flex-col items-center justify-center px-5 py-7 shadow-[0_18px_50px_rgba(60,45,30,0.08)] backdrop-blur-md"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: cardBorderRadius,
                }}
              >
                <span style={ts.externalCountdownValue}>
                  <EditableText elementKey="externalCountdownValue">
                    {formatCountdownValue(unit.value)}
                  </EditableText>
                </span>
                <span className="mt-4" style={ts.externalCountdownLabel}>
                  <EditableText elementKey="externalCountdownLabel">
                    {unit.label}
                  </EditableText>
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
