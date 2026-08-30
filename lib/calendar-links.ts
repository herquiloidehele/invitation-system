import type { DateInfo, LocationInfo } from "./types";

/**
 * Build a Google Calendar "add event" URL for a 3-hour window starting at the
 * event's ISO datetime. Extracted verbatim from CalendarButton so the AI SDK
 * and the standard renderer share one implementation. (CalendarButton is not
 * repointed in this plan to avoid touching a render path; dedup is a later
 * cleanup.)
 */
export function buildGoogleCalendarUrl({
  date,
  location,
  title,
  details,
}: {
  date: DateInfo;
  location: LocationInfo;
  title: string;
  details: string;
}): string {
  const start = new Date(date.iso);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details,
    location: `${location.name}, ${location.address}`,
    trp: "false",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
