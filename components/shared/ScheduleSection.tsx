"use client";

import { Fragment } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Bell,
  Bird,
  Cake,
  Camera,
  Car,
  Church,
  Clock3,
  Coffee,
  Cross,
  Flower,
  Flower2,
  Gem,
  Gift,
  Heart,
  HeartHandshake,
  type LucideIcon,
  Map as MapIcon,
  Mic2,
  Music2,
  PartyPopper,
  Sparkles,
  Sunset,
  Utensils,
  Wine,
} from "lucide-react";

import type {
  CustomTexts,
  ScheduleEvent,
  ScheduleIcon,
  ScheduleStyle,
  TemplateTheme,
} from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { t } from "@/lib/custom-texts";
import { EditableCard } from "./EditableCard";
import { EditableText } from "./EditableText";
import ScheduleItem from "./ScheduleItem";
import { EASE, WordReveal } from "./animations";

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const illustratedRow: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: EASE },
  }),
};

const illustratedRowFade: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.55, delay: 0.1 + i * 0.12, ease: EASE },
  }),
};

type ScheduleCardStyle = {
  cardBg: string;
  cardBorder: string;
  borderRadius: number;
  accentColor?: string;
};

interface ScheduleSectionProps {
  schedule: ScheduleEvent[];
  scheduleStyle?: ScheduleStyle;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  cardStyle: ScheduleCardStyle;
  customTexts?: CustomTexts;
  isPreview?: boolean;
}

const PRESET_ICONS: Record<Exclude<ScheduleIcon, "custom">, LucideIcon> = {
  neutral: Clock3,
  rings: Gem,
  church: Church,
  cross: Cross,
  heart: Heart,
  "heart-handshake": HeartHandshake,
  toast: Wine,
  dinner: Utensils,
  cake: Cake,
  coffee: Coffee,
  dance: Music2,
  music: Mic2,
  party: PartyPopper,
  sparkles: Sparkles,
  gift: Gift,
  flower: Flower,
  bouquet: Flower2,
  car: Car,
  camera: Camera,
  sunset: Sunset,
  bell: Bell,
  bird: Bird,
  map: MapIcon,
};

function ScheduleIconGraphic({
  icon,
  iconUrl,
  color,
  size = 22,
}: {
  icon?: ScheduleIcon;
  iconUrl?: string;
  color: string;
  size?: number;
}) {
  if (icon === "custom" && iconUrl) {
    return (
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          WebkitMaskImage: `url(${iconUrl})`,
          maskImage: `url(${iconUrl})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }

  const Cmp =
    icon && icon !== "custom" ? PRESET_ICONS[icon] : PRESET_ICONS.neutral;
  return <Cmp size={size} color={color} strokeWidth={1.6} />;
}

function DefaultScheduleCard({
  schedule,
  ts,
  cardStyle,
}: {
  schedule: ScheduleEvent[];
  ts: ResolvedTextStyles;
  cardStyle: ScheduleCardStyle;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        background: cardStyle.cardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: cardStyle.borderRadius,
        overflow: "hidden",
        padding: "8px 0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
        border: `1px solid ${cardStyle.cardBorder}`,
      }}
    >
      {schedule.map((event, i) => (
        <div key={i}>
          {i > 0 && (
            <div
              className="mx-6"
              style={{ height: 1, background: cardStyle.cardBorder }}
            />
          )}
          <ScheduleItem
            time={event.time}
            label={event.label}
            venue={event.venue}
            accentColor={ts.accent}
            timeStyle={ts.scheduleTime}
            labelStyle={ts.scheduleLabel}
            venueStyle={ts.scheduleVenue}
            index={i}
          />
        </div>
      ))}
    </motion.div>
  );
}

function IllustratedScheduleCard({
  schedule,
  ts,
  theme,
  cardStyle,
  isPreview,
}: {
  schedule: ScheduleEvent[];
  ts: ResolvedTextStyles;
  theme: TemplateTheme;
  cardStyle: ScheduleCardStyle;
  isPreview?: boolean;
}) {
  const accent = cardStyle.accentColor || ts.accent || theme.accent;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        background: cardStyle.cardBg,
        borderRadius: cardStyle.borderRadius,
        padding: "32px 24px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 12px 36px rgba(0,0,0,0.06)",
        border: `1px solid ${cardStyle.cardBorder}`,
      }}
    >
      <motion.div
        className="grid items-center gap-x-4 gap-y-8"
        style={{ gridTemplateColumns: "auto 1fr auto" }}
        initial="hidden"
        {...(isPreview
          ? { animate: "visible" }
          : {
              whileInView: "visible",
              viewport: { once: true, margin: "-40px" },
            })}
      >
        {schedule.map((event, index) => (
          <Fragment key={`row-${index}`}>
            {/* Icon — slides in, then floats forever */}
            <motion.div
              custom={index}
              variants={illustratedRow}
              style={{ display: "inline-flex" }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6 + index * 0.3,
                }}
                style={{ display: "inline-flex" }}
              >
                <ScheduleIconGraphic
                  icon={event.icon}
                  iconUrl={event.iconUrl}
                  color={accent}
                />
              </motion.div>
            </motion.div>

            {/* Connector — draws from left, per row */}
            <motion.div
              custom={index}
              variants={{
                hidden: { scaleX: 0 },
                visible: (i: number) => ({
                  scaleX: 1,
                  transition: {
                    duration: 0.7,
                    delay: 0.2 + i * 0.12,
                    ease: EASE,
                  },
                }),
              }}
              className="h-[1px] w-full min-w-[24px] rounded-full"
              style={{ background: accent, transformOrigin: "left center" }}
            />

            {/* Text — width = widest text across rows */}
            <motion.div
              custom={index}
              variants={illustratedRowFade}
              className="min-w-0"
            >
              <EditableText elementKey="scheduleTime">
                <div style={ts.scheduleTime}>{event.time}</div>
              </EditableText>
              <EditableText elementKey="scheduleLabel">
                <div
                  style={{
                    ...ts.scheduleLabel,
                    textTransform: "none",
                    fontVariantCaps: "normal",
                    letterSpacing: 0,
                  }}
                >
                  {event.label}
                </div>
              </EditableText>
              {event.venue && (
                <EditableText elementKey="scheduleVenue">
                  <div style={ts.scheduleVenue}>{event.venue}</div>
                </EditableText>
              )}
            </motion.div>
          </Fragment>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function ScheduleSection({
  schedule,
  scheduleStyle = "default",
  theme,
  ts,
  cardStyle,
  customTexts,
  isPreview = false,
}: ScheduleSectionProps) {
  const resolvedStyle =
    scheduleStyle === "illustrated" ? "illustrated" : "default";

  return (
    <>
      <motion.section
        variants={{
          hidden: { opacity: 0, y: 28 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: EASE },
          },
        }}
        initial="hidden"
        {...(isPreview
          ? { animate: "visible" }
          : {
              whileInView: "visible",
              viewport: { once: true, margin: "-60px" },
            })}
        className="px-6 pb-2"
      >
        <div className="flex flex-col items-center">
          <span style={ts.sectionTitles}>
            <EditableText elementKey="sectionTitles">
              <WordReveal
                text={t(customTexts, "sectionTitle_schedule")}
                isPreview={isPreview}
              />
            </EditableText>
          </span>

          <motion.div
            className="mt-3 mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            style={{
              width: 28,
              height: 1,
              background: ts.accent,
              opacity: 0.25,
              transformOrigin: "center",
            }}
          />
        </div>
      </motion.section>

      <motion.div
        className="px-6 pb-10"
        variants={staggerContainer}
        initial="hidden"
        {...(isPreview
          ? { animate: "visible" }
          : {
              whileInView: "visible",
              viewport: { once: true, margin: "-40px" },
            })}
      >
        <EditableCard sectionKey="schedule">
          {resolvedStyle === "illustrated" ? (
            <IllustratedScheduleCard
              schedule={schedule}
              theme={theme}
              ts={ts}
              cardStyle={cardStyle}
              isPreview={isPreview}
            />
          ) : (
            <DefaultScheduleCard
              schedule={schedule}
              ts={ts}
              cardStyle={cardStyle}
            />
          )}
        </EditableCard>
      </motion.div>
    </>
  );
}
