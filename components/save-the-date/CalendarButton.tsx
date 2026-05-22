import type {
  SaveTheDateDate,
  SaveTheDateCouple,
  SaveTheDateThemeData,
} from "@/lib/save-the-date";

interface CalendarButtonProps {
  date: SaveTheDateDate;
  couple: SaveTheDateCouple;
  theme: SaveTheDateThemeData;
  visible: boolean;
}

function buildGoogleCalendarUrl(
  date: SaveTheDateDate,
  couple: SaveTheDateCouple
): string {
  const title = encodeURIComponent(
    `${couple.bride} & ${couple.groom} — Wedding`
  );
  // Use the ISO date for the calendar event (all-day)
  const d = date.iso.replace(/-/g, "");
  // All-day event: YYYYMMDD/YYYYMMDD (next day)
  const isoDate = new Date(date.iso);
  const nextDay = new Date(isoDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const end = nextDay.toISOString().split("T")[0].replace(/-/g, "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${d}/${end}&details=${encodeURIComponent(
    "Save the date!"
  )}`;
}

function isValidDateIso(iso: string): boolean {
  if (!iso) return false;
  return !Number.isNaN(new Date(iso).getTime());
}

export default function CalendarButton({
  date,
  couple,
  theme,
  visible,
}: CalendarButtonProps) {
  if (!visible) return null;
  if (!isValidDateIso(date.iso)) return null;

  const url = buildGoogleCalendarUrl(date, couple);

  return (
    <div className="w-full px-8">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-transform active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${theme.heartColor}, ${theme.heartGlitterColors[0] || theme.heartColor})`,
          color: "#FFFFFF",
          fontFamily: theme.coupleFont,
        }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Add to Calendar
      </a>
    </div>
  );
}
