"use client";

import { motion, type Variants } from "framer-motion";
import { Clock3, Gem, Music2, Utensils, Wine } from "lucide-react";

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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

type ScheduleCardStyle = {
  cardBg: string;
  cardBorder: string;
  borderRadius: number;
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

function ScheduleIconGraphic({
  icon,
  color,
  size = 22,
}: {
  icon?: ScheduleIcon;
  color: string;
  size?: number;
}) {
  const props = { size, color, strokeWidth: 1.6 };

  switch (icon) {
    case "rings":
      return <Gem {...props} />;
    case "toast":
      return <Wine {...props} />;
    case "dinner":
      return <Utensils {...props} />;
    case "dance":
      return <Music2 {...props} />;
    case "neutral":
    default:
      return <Clock3 {...props} />;
  }
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
    <div
      style={{
        background: cardStyle.cardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: cardStyle.borderRadius,
        overflow: "hidden",
        padding: "8px 0",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
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
    </div>
  );
}

function IllustratedScheduleCard({
  schedule,
  ts,
  theme,
  cardStyle,
}: {
  schedule: ScheduleEvent[];
  ts: ResolvedTextStyles;
  theme: TemplateTheme;
  cardStyle: ScheduleCardStyle;
}) {
  const accent = ts.accent || theme.accent;

  return (
    <div
      style={{
        background: cardStyle.cardBg,
        borderRadius: cardStyle.borderRadius,
        padding: "32px 24px",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 12px 36px rgba(0,0,0,0.06)",
        border: `1px solid ${cardStyle.cardBorder}`,
      }}
    >
      <div className="flex flex-col gap-8">
        {schedule.map((event, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.5,
              delay: index * 0.08,
              ease: "easeOut",
            }}
          >
            {/* Icon in outlined circle */}
            <div
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: 56,
                height: 56,
                border: `1.5px solid ${accent}`,
              }}
            >
              <ScheduleIconGraphic icon={event.icon} color={accent} />
            </div>

            {/* Connector */}
            <div
              className="shrink-0 rounded-full"
              style={{
                width: 56,
                height: 3,
                background: accent,
              }}
            />

            {/* Text */}
            <div className="min-w-0 flex-1">
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
            </div>
          </motion.div>
        ))}
      </div>
    </div>
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
              {t(customTexts, "sectionTitle_schedule")}
            </EditableText>
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
              background: ts.accent,
              opacity: 0.25,
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
