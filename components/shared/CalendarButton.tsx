"use client";

import type { ReactNode } from "react";
import type {
  CoupleInfo,
  DateInfo,
  InvitationEventType,
  LocationInfo,
} from "@/lib/types";
import { buildInvitationDisplayName, isWeddingEventType } from "@/lib/invitation-event-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CalendarButtonProps {
  date: DateInfo;
  location: LocationInfo;
  couple: CoupleInfo;
  eventType: InvitationEventType;
  className?: string;
  children: ReactNode;
  onCalendarClick?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a Google Calendar "Add Event" URL with pre-filled details.
 *
 * Google Calendar expects dates in the format `YYYYMMDDTHHmmssZ` (UTC) or
 * `YYYYMMDD` for all-day events.  We use the ISO string from `DateInfo` to
 * derive start/end times (defaulting to a 3-hour ceremony window when no
 * precise end time is available).
 */
function buildGoogleCalendarUrl(
  date: DateInfo,
  location: LocationInfo,
  couple: CoupleInfo,
  eventType: InvitationEventType,
): string {
  const displayName = buildInvitationDisplayName({
    eventType,
    primaryName: couple.bride,
    secondaryName: couple.groom,
  });
  const title = isWeddingEventType(eventType)
    ? `Casamento ${displayName}`
    : `Evento ${displayName}`;
  const details = isWeddingEventType(eventType)
    ? `Cerimônia de casamento de ${couple.bride} e ${couple.groom}.\n\n${location.name}\n${location.address}`
    : `Celebração de ${displayName}.\n\n${location.name}\n${location.address}`;

  // Parse ISO date and create start/end (3-hour window)
  const start = new Date(date.iso);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarButton({
  date,
  location,
  couple,
  eventType,
  className,
  children,
  onCalendarClick,
}: CalendarButtonProps) {
  const handleClick = () => {
    onCalendarClick?.();
    const url = buildGoogleCalendarUrl(date, location, couple, eventType);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
