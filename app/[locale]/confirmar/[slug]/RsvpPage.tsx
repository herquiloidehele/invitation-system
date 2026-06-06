"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type {
  CustomTexts,
  InvitationEventType,
  TemplateTheme,
} from "@/lib/types";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import RsvpHero from "./RsvpHero";
import RsvpForm, { type RsvpFormData } from "./RsvpForm";
import RsvpResultState, { type RsvpResultKind } from "./RsvpResultState";

function getRsvpSubmittedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function markRsvpSubmitted(slug: string) {
  const slugs = getRsvpSubmittedSlugs();
  if (!slugs.includes(slug)) {
    localStorage.setItem(
      RSVP_SUBMITTED_SLUGS_KEY,
      JSON.stringify([...slugs, slug]),
    );
  }
}

function hasSubmittedRsvp(slug: string): boolean {
  return getRsvpSubmittedSlugs().includes(slug);
}

interface RsvpPageProps {
  slug: string;
  eventType: InvitationEventType;
  bride: string;
  groom: string;
  monogram?: string;
  dateDisplay: string;
  dateIso?: string;
  dateTime?: string;
  deadline?: string;
  deadlinePassed: boolean;
  showEmail?: boolean;
  showDietaryRestrictions?: boolean;
  adminBackgroundOverride?: string;
  cinematicImageUrl?: string;
  videoUrl?: string;
  videoPoster?: string;
  heroImage: string;
  theme: TemplateTheme;
  customTexts?: CustomTexts;
}

type SubmitState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "already_submitted";

export default function RsvpPage({
  slug,
  eventType,
  bride,
  groom,
  dateDisplay,
  dateIso,
  dateTime,
  deadline,
  deadlinePassed,
  showEmail = false,
  showDietaryRestrictions = true,
  adminBackgroundOverride,
  cinematicImageUrl,
  videoPoster,
  theme,
  customTexts,
}: RsvpPageProps) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  useEffect(() => {
    if (hasSubmittedRsvp(slug)) {
      setSubmitState("already_submitted");
    }
  }, [slug]);

  const invitationName = buildInvitationDisplayName({
    eventType,
    primaryName: bride,
    secondaryName: groom,
  });

  const onSubmit = async (data: RsvpFormData) => {
    setSubmitState("loading");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationSlug: slug,
          guestName: data.name,
          email: data.email || undefined,
          attending: data.attending === "yes",
          dietaryRestrictions: data.dietaryRestrictions || undefined,
          message: data.message || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      markRsvpSubmitted(slug);
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  };

  const pageStyle: CSSProperties = {
    backgroundColor: theme.bg,
    fontFamily: theme.bodyFont,
    color: theme.textPrimary,
  };

  const cardStyle: CSSProperties = {
    backgroundColor: theme.cardBg,
    borderColor: theme.cardBorder,
  };

  const resultKind: RsvpResultKind | null = deadlinePassed
    ? "deadline"
    : submitState === "already_submitted"
      ? "already_submitted"
      : submitState === "success"
        ? "success"
        : submitState === "error"
          ? "error"
          : null;

  return (
    <div className="min-h-dvh flex flex-col" style={pageStyle}>
      <RsvpHero
        theme={theme}
        customTexts={customTexts}
        invitationName={invitationName}
        dateDisplay={dateDisplay}
        dateIso={dateIso}
        dateTime={dateTime}
        adminBackgroundOverride={adminBackgroundOverride}
        cinematicImageUrl={cinematicImageUrl}
        videoPoster={videoPoster}
      />

      <main className="flex-1 flex items-start justify-center px-4 pb-14">
        <div
          className="w-full max-w-md rounded-2xl border shadow-sm overflow-hidden"
          style={cardStyle}
        >
          {resultKind ? (
            <RsvpResultState
              kind={resultKind}
              theme={theme}
              customTexts={customTexts}
              deadline={deadline}
              onRetry={
                resultKind === "error"
                  ? () => setSubmitState("idle")
                  : undefined
              }
            />
          ) : (
            <RsvpForm
              theme={theme}
              customTexts={customTexts}
              showEmail={showEmail}
              showDietaryRestrictions={showDietaryRestrictions}
              deadline={deadline}
              submitting={submitState === "loading"}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
