"use client";

import type { CustomTexts, InvitationData } from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { useCustomText } from "@/lib/custom-texts";

import CalendarButton from "./CalendarButton";
import { EditableText } from "./EditableText";

export default function CalendarCTA({
  invitation,
  ts,
  customTexts: ct,
}: {
  invitation: InvitationData;
  ts: ResolvedTextStyles;
  customTexts?: CustomTexts;
}) {
  const t = useCustomText(ct);

  if (invitation.showCalendarCta === false) return null;

  return (
    <CalendarButton
      date={invitation.date}
      location={invitation.location}
      couple={invitation.couple}
      eventType={invitation.eventType}
      className="mt-5 flex items-center justify-center gap-2 px-5 py-2 transition-all"
    >
      <span style={ts.calendarCta}>
        <EditableText elementKey="calendarCta">
          {t("cta_addToCalendar")}
        </EditableText>
      </span>
    </CalendarButton>
  );
}
