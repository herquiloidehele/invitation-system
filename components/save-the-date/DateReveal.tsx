"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "next-intl";
import type {
  SaveTheDateDate,
  SaveTheDateThemeData,
} from "@/lib/save-the-date";
import type { TextStyle } from "@/lib/types";
import { formatLocalizedMonthLong } from "@/lib/date-format";
import { EditableText } from "@/components/shared/EditableText";

interface DateRevealProps {
  date: SaveTheDateDate;
  theme: SaveTheDateThemeData;
  dateOverride?: TextStyle;
  dateLabelOverride?: TextStyle;
  resolvedDateFont: string;
  resolvedDateLabelFont: string;
  revealed: boolean;
  forceReveal?: boolean;
}

export default function DateReveal({
  date,
  theme,
  dateOverride,
  dateLabelOverride,
  resolvedDateFont,
  resolvedDateLabelFont,
  revealed,
  forceReveal = false,
}: DateRevealProps) {
  const show = revealed || forceReveal;
  const locale = useLocale();
  const monthDisplay = formatLocalizedMonthLong(
    date.iso,
    locale,
    date.month,
  );
  const dateStyle = {
    fontFamily: resolvedDateFont,
    color: dateOverride?.color ?? theme.textColor,
    ...(dateOverride?.fontSize ? { fontSize: dateOverride.fontSize } : {}),
    ...(dateOverride?.fontWeight
      ? { fontWeight: dateOverride.fontWeight }
      : {}),
    ...(dateOverride?.letterSpacing
      ? { letterSpacing: dateOverride.letterSpacing }
      : {}),
  };
  const dateLabelStyle = {
    fontFamily: resolvedDateLabelFont,
    color: dateLabelOverride?.color ?? theme.textColor,
    ...(dateLabelOverride?.fontSize ? { fontSize: dateLabelOverride.fontSize } : {}),
    ...(dateLabelOverride?.fontWeight
      ? { fontWeight: dateLabelOverride.fontWeight }
      : {}),
    ...(dateLabelOverride?.letterSpacing
      ? { letterSpacing: dateLabelOverride.letterSpacing }
      : {}),
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center -mt-6.25">
      <AnimatePresence>
        {show && (
          <>
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: forceReveal ? 0 : 0.4,
                duration: 0.7,
                ease: "easeOut",
              }}
              className="text-3xl font-semibold tracking-widest"
              style={dateStyle}
            >
              <EditableText elementKey="stdDate">
                {date.day}.{monthDisplay}.{date.year}
              </EditableText>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: forceReveal ? 0 : 0.7, duration: 0.6 }}
              className="text-lg font-bold tracking-[0.3em] uppercase"
              style={dateLabelStyle}
            >
              <EditableText elementKey="stdDateLabel">
                {(() => {
                  if (date.time && /^\d{2}:\d{2}$/.test(date.time)) {
                    return date.time;
                  }
                  const d = new Date(date.iso);
                  if (isNaN(d.getTime())) return "";
                  const hh = String(d.getHours()).padStart(2, "0");
                  const mm = String(d.getMinutes()).padStart(2, "0");
                  return `${hh}:${mm}`;
                })()}
              </EditableText>
            </motion.p>
          </>
        )}
      </AnimatePresence>

      {/* Placeholder when not revealed — keeps the heart centered */}
      {!show && (
        <div className="text-transparent select-none text-3xl">
          {date.day}.{monthDisplay}.{date.year}
        </div>
      )}
    </div>
  );
}
