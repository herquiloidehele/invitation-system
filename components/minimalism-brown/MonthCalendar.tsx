"use client";

import { useLocale } from "next-intl";
import type { TemplateTheme } from "@/lib/types";
import { buildMonthGrid, mbTokens, readableOn } from "@/lib/minimalism-brown";
import { useIdle } from "./motion";

/**
 * Month grid for the wedding's month, with the day itself marked.
 *
 * Weekday and month names come from Intl in the active locale rather than a
 * hard-coded array, so the calendar reads correctly in pt/en/es. Renders
 * nothing when the date can't be parsed.
 */
export default function MonthCalendar({
  iso,
  theme,
  color,
}: {
  iso: string;
  theme: TemplateTheme;
  /** Foreground on the inverted panel. */
  color: string;
}) {
  const locale = useLocale();
  const t = mbTokens(theme);
  const markIdle = useIdle("shimmer", 0, 3.4);
  const grid = buildMonthGrid(iso, 1);
  if (!grid) return null;

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(grid.year, grid.month, 1)));

  // Monday-first weekday headers, derived rather than hard-coded.
  //
  // The reference uses two-letter labels, which works in English but collapses
  // in Portuguese: qua/qui both become "qu" and seg/sex both become "se". We
  // keep the locale's own short form (minus its trailing period) so every
  // column stays distinguishable.
  const weekdayFmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    // 2024-01-01 was a Monday.
    weekdayFmt.format(new Date(Date.UTC(2024, 0, 1 + i))).replace(/\.$/, ""),
  );

  const cell: React.CSSProperties = {
    textAlign: "center",
    fontFamily: theme.bodyFont,
    fontSize: 12,
    fontWeight: 300,
    color,
    padding: "4px 0",
  };

  return (
    <div style={{ marginTop: t.gap.block }}>
      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontFamily: theme.scriptFont ?? theme.displayFont,
          fontSize: 24,
          letterSpacing: "0.6px",
          color,
        }}
      >
        {monthLabel}
      </p>

      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
        }}
      >
        {weekdays.map((w, i) => (
          <span key={i} style={{ ...cell, fontSize: 10, fontWeight: 500 }}>
            {w}
          </span>
        ))}

        {grid.weeks.flat().map((day, i) =>
          day === null ? (
            <span key={`b-${i}`} style={cell} />
          ) : day.isTarget ? (
            <span key={`d-${day.day}`} style={cell}>
              <span
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: theme.accent,
                  // The accent is a pale gold; pale text on it lands near 2:1.
                  // Pick whichever of the theme's own dark/light reads on it.
                  color: readableOn(theme.accent, [
                    theme.textPrimary,
                    theme.ctaPrimaryText,
                    "#3B322C",
                  ]),
                  fontWeight: 600,
                  ...markIdle,
                }}
              >
                {day.day}
              </span>
            </span>
          ) : (
            <span key={`d-${day.day}`} style={cell}>
              {day.day}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
