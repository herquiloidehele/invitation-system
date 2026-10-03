"use client";

import { useState } from "react";
import { NextIntlClientProvider } from "next-intl";

import RsvpPage from "@/components/rsvp-page/RsvpPage";
import { Button } from "@/components/ui/button";
import { getClientMessages } from "@/i18n/client-messages";
import type { AppLocale } from "@/i18n/locales";
import { formatLocalizedLongDate } from "@/lib/date-format";
import {
  getRsvpCustomFields,
  shouldShowRsvpCompanion,
  shouldShowRsvpDietaryRestrictions,
  shouldShowRsvpEmail,
  shouldShowRsvpNumAdults,
  shouldShowRsvpNumChildren,
} from "@/lib/rsvp-config";
import { resolveRsvpPageStyle } from "@/lib/rsvp-page-style";
import type { RsvpPagePreviewState } from "@/lib/rsvp-page-view";
import type { InvitationData, TemplateTheme } from "@/lib/types";

const STATES: { value: RsvpPagePreviewState; label: string }[] = [
  { value: "form", label: "Formulário" },
  { value: "success", label: "Sucesso" },
  { value: "already", label: "Já confirmado" },
  { value: "closed", label: "Encerrado" },
];

export default function RsvpPagePreview({
  invitation,
  theme,
  locale,
}: {
  invitation: InvitationData;
  theme: TemplateTheme | undefined;
  locale: AppLocale;
}) {
  const [state, setState] = useState<RsvpPagePreviewState>("form");
  const { couple, date, rsvp } = invitation;
  const tokens = resolveRsvpPageStyle({
    config: invitation.rsvpPage,
    theme,
    rsvp,
  });
  const dateDisplay = date.iso
    ? formatLocalizedLongDate(date.iso, locale, date.display)
    : date.display;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap gap-1 border-b bg-background px-3 py-2">
        {STATES.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={state === option.value ? "default" : "ghost"}
            className="h-7 px-2.5 text-xs"
            onClick={() => setState(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="relative flex-1 overflow-y-auto">
        <NextIntlClientProvider
          locale={locale}
          messages={getClientMessages(locale)}
        >
          {/* Remount per state so a preview submit never sticks. */}
          <RsvpPage
            key={state}
            preview={{ state }}
            slug={invitation.slug || "preview"}
            eventType={invitation.eventType}
            bride={couple.bride}
            groom={couple.groom}
            monogram={couple.monogram}
            dateDisplay={dateDisplay}
            deadline={rsvp.deadline}
            deadlinePassed={false}
            closed={false}
            showEmail={shouldShowRsvpEmail(rsvp)}
            showDietaryRestrictions={shouldShowRsvpDietaryRestrictions(rsvp)}
            showCompanion={shouldShowRsvpCompanion(rsvp)}
            showNumAdults={shouldShowRsvpNumAdults(rsvp)}
            showNumChildren={shouldShowRsvpNumChildren(rsvp)}
            customFields={getRsvpCustomFields(rsvp)}
            tokens={tokens}
            customTexts={invitation.customTexts}
          />
        </NextIntlClientProvider>
      </div>
    </div>
  );
}
