"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type {
  CoupleInfo,
  DateInfo,
  InvitationEventType,
  LocationInfo,
} from "@/lib/types";
import {
  buildInvitationDisplayName,
  isWeddingEventType,
} from "@/lib/invitation-event-types";

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
function buildGoogleCalendarUrl({
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
  const t = useTranslations("Invitation");

  const handleClick = () => {
    onCalendarClick?.();
    const displayName = buildInvitationDisplayName({
      eventType,
      primaryName: couple.bride,
      secondaryName: couple.groom,
    });
    const title = isWeddingEventType(eventType)
      ? t("calendar_weddingTitle", { names: displayName })
      : t("calendar_genericTitle", { name: displayName });
    const details = isWeddingEventType(eventType)
      ? t("calendar_weddingDetails", {
          bride: couple.bride,
          groom: couple.groom,
          venue: location.name,
          address: location.address,
        })
      : t("calendar_genericDetails", {
          name: displayName,
          venue: location.name,
          address: location.address,
        });
    const url = buildGoogleCalendarUrl({ date, location, title, details });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
