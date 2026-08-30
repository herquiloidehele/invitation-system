"use client";

import { useMemo } from "react";

import { buildGoogleCalendarUrl } from "@/lib/calendar-links";
import type { CalendarApi } from "@/lib/ai-secondary-types";
import { usePlatformContext } from "./PlatformContext";

/**
 * A ready Google Calendar link for the event, using the couple names as the
 * title and the venue as details. The generated bundle renders it as an anchor
 * or opens it on click.
 */
export function useCalendar(): CalendarApi {
  const { invitation } = usePlatformContext();

  const googleUrl = useMemo(() => {
    const couple = invitation.couple;
    const title = `${couple.bride} & ${couple.groom}`;
    const details = `${invitation.location.name}, ${invitation.location.address}`;
    return buildGoogleCalendarUrl({
      date: invitation.date,
      location: invitation.location,
      title,
      details,
    });
  }, [invitation.couple, invitation.date, invitation.location]);

  return { googleUrl };
}
