"use client";

import { AnimatePresence, motion } from "framer-motion";
import type {
  SaveTheDateDate,
  SaveTheDateThemeData,
} from "@/lib/save-the-date";

interface DateRevealProps {
  date: SaveTheDateDate;
  theme: SaveTheDateThemeData;
  revealed: boolean;
}

export default function DateReveal({ date, theme, revealed }: DateRevealProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <AnimatePresence>
        {revealed && (
          <>
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
              className="text-3xl font-semibold tracking-widest"
              style={{
                fontFamily: theme.dateFont,
                color: theme.textColor,
              }}
            >
              {date.day}.{date.month}.{date.year}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-lg font-bold tracking-[0.3em] uppercase"
              style={{
                fontFamily: theme.dateFont,
                color: theme.textColor,
              }}
            >
              Save the Date
            </motion.p>
          </>
        )}
      </AnimatePresence>

      {/* Placeholder when not revealed — keeps the heart centered */}
      {!revealed && (
        <div className="text-transparent select-none text-3xl">
          {date.day}.{date.month}.{date.year}
        </div>
      )}
    </div>
  );
}
