"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle, Clock, Lock } from "lucide-react";

import type {
  CustomTexts,
  InvitationEventType,
  QrCodeStyle,
  RsvpCustomField,
} from "@/lib/types";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";
import { useCustomText } from "@/lib/custom-texts";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";
import { buildPersonalInviteUrl } from "@/lib/guest-links";
import { buildPassUrl } from "@/lib/checkin-links";
import {
  buildEntryPassValue,
  readGuestPassToken,
  storeGuestPassToken,
} from "@/lib/entry-pass";
import type { RsvpPageTokens } from "@/lib/rsvp-page-style";
import {
  resolveRsvpPageView,
  type RsvpPagePreviewState,
  type RsvpSubmitState,
} from "@/lib/rsvp-page-view";
import { useDynamicFonts } from "@/hooks/useDynamicFont";
import EntryPassQr from "@/components/shared/EntryPassQr";
import RsvpPageShell from "./RsvpPageShell";
import RsvpPageForm, { type RsvpPageFormSubmission } from "./RsvpPageForm";
import { RsvpStatusPanel, rsvpRetryButtonStyle } from "./RsvpPageStatus";

// ---------------------------------------------------------------------------
// localStorage helpers — same key as RSVPModal so the guard is shared
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RsvpPageProps {
  slug: string;
  eventType: InvitationEventType;
  bride: string;
  groom: string;
  monogram?: string;
  dateDisplay: string;
  deadline?: string;
  deadlinePassed: boolean;
  closed: boolean;
  showEmail?: boolean;
  showDietaryRestrictions?: boolean;
  showCompanion?: boolean;
  showNumAdults?: boolean;
  showNumChildren?: boolean;
  customFields?: RsvpCustomField[];
  /** Resolved appearance — see lib/rsvp-page-style.ts. */
  tokens: RsvpPageTokens;
  customTexts?: CustomTexts;
  /** Guest token from the `?g=` confirm link — links the RSVP to a guest. */
  guestToken?: string;
  /** Display name to prefill, resolved from the guest token server-side. */
  prefillName?: string;
  /** When true, shows a downloadable QR entry pass after an attending RSVP. */
  checkInEnabled?: boolean;
  /** Colors for the entry-pass QR. */
  qrStyle?: QrCodeStyle;
  /** Admin preview: no network, no storage, pinned to one panel. */
  preview?: { state: RsvpPagePreviewState };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RsvpPage({
  slug,
  eventType,
  bride,
  groom,
  monogram,
  dateDisplay,
  deadline,
  deadlinePassed,
  closed,
  showEmail = false,
  showDietaryRestrictions = true,
  showCompanion = false,
  showNumAdults = false,
  showNumChildren = false,
  customFields = [],
  tokens,
  customTexts: ct,
  guestToken,
  prefillName,
  checkInEnabled = false,
  qrStyle,
  preview,
}: RsvpPageProps) {
  const isPreview = preview !== undefined;
  const [submitState, setSubmitState] = useState<RsvpSubmitState>("idle");
  const [passInfo, setPassInfo] = useState<{
    attending: boolean;
    checkInToken: string | null;
    name: string;
  } | null>(null);
  const resolveText = useCustomText(ct);
  useDynamicFonts([tokens.fonts.title, tokens.fonts.body]);

  // Rebuild the guest's entry pass so the already-confirmed state (shown on
  // reload) can display it: personalized guests use their `?g=` token, others
  // use the check-in token stored at confirmation. Read via useSyncExternalStore
  // to avoid setState in an effect.
  const alreadyPassValue = useSyncExternalStore(
    () => () => {},
    () => {
      if (!checkInEnabled || isPreview) return null;
      return buildEntryPassValue({
        origin: window.location.origin,
        slug,
        guestToken: guestToken || undefined,
        guestName: prefillName,
        checkInToken: guestToken ? null : readGuestPassToken(slug),
      });
    },
    () => null,
  );

  // Check localStorage on mount
  useEffect(() => {
    if (isPreview) return;
    if (hasSubmittedRsvp(slug)) {
      setSubmitState("already_submitted");
    }
  }, [slug, isPreview]);

  const invitationName = buildInvitationDisplayName({
    eventType,
    primaryName: bride,
    secondaryName: groom,
  });

  const onSubmit = async ({ data, customAnswers }: RsvpPageFormSubmission) => {
    if (isPreview) {
      setSubmitState("success");
      return;
    }
    setSubmitState("loading");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationSlug: slug,
          guestToken,
          guestName: data.name,
          email: data.email || undefined,
          attending: data.attending === "yes",
          dietaryRestrictions: data.dietaryRestrictions || undefined,
          companion: data.companion || undefined,
          numAdults: showNumAdults ? data.numAdults : undefined,
          numChildren: showNumChildren ? data.numChildren : undefined,
          message: data.message || undefined,
          customAnswers,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const json = (await res.json().catch(() => ({}))) as {
        checkInToken?: string | null;
      };
      markRsvpSubmitted(slug);
      setPassInfo({
        attending: data.attending === "yes",
        checkInToken: json.checkInToken ?? null,
        name: data.name,
      });
      if (json.checkInToken) {
        storeGuestPassToken(slug, json.checkInToken);
      }
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  };

  const view = resolveRsvpPageView({
    closed,
    deadlinePassed,
    submitState,
    previewState: preview?.state,
  });
  const { colors } = tokens;

  const successPassValue =
    checkInEnabled && passInfo?.attending && typeof window !== "undefined"
      ? guestToken
        ? buildPersonalInviteUrl({
            origin: window.location.origin,
            slug,
            token: guestToken,
            name: passInfo.name || prefillName || "",
          })
        : passInfo.checkInToken
          ? buildPassUrl(window.location.origin, slug, passInfo.checkInToken)
          : ""
      : "";

  return (
    <RsvpPageShell
      tokens={tokens}
      eyebrow={resolveText("cta_confirmLabel")}
      title={invitationName}
      dateDisplay={dateDisplay}
      monogram={monogram}
      preview={isPreview}
    >
      {view === "closed" ? (
        <RsvpStatusPanel
          icon={Lock}
          iconColor={colors.muted}
          title={resolveText("rsvp_closedTitle")}
          message={resolveText("rsvp_closedMessage")}
          tokens={tokens}
        />
      ) : view === "deadline" ? (
        <RsvpStatusPanel
          icon={Clock}
          iconColor={colors.muted}
          title={resolveText("rsvp_deadlineClosedTitle")}
          message={resolveText("rsvp_deadlineClosedMessage", {
            deadline: deadline
              ? resolveText("rsvp_deadlineDatePrefix", { deadline })
              : "",
          })}
          tokens={tokens}
        />
      ) : view === "already" ? (
        <RsvpStatusPanel
          icon={CheckCircle}
          iconColor="#22c55e"
          title={resolveText("rsvp_alreadyTitle")}
          message={resolveText("rsvp_alreadyMessage")}
          tokens={tokens}
        >
          {alreadyPassValue ? (
            <EntryPassQr
              value={alreadyPassValue}
              title={resolveText("rsvp_entryPassTitle")}
              downloadLabel={resolveText("entryPass_downloadButton")}
              fgColor={qrStyle?.fgColor}
              bgColor={qrStyle?.bgColor}
            />
          ) : null}
        </RsvpStatusPanel>
      ) : view === "success" ? (
        <RsvpStatusPanel
          icon={CheckCircle}
          iconColor={colors.accent}
          title={resolveText("rsvp_successTitle")}
          message={resolveText("rsvp_successMessage")}
          tokens={tokens}
        >
          {successPassValue ? (
            <div className="mt-2 flex justify-center">
              <EntryPassQr
                value={successPassValue}
                title={resolveText("rsvp_entryPassTitle")}
                downloadLabel={resolveText("entryPass_downloadButton")}
                fgColor={qrStyle?.fgColor}
                bgColor={qrStyle?.bgColor}
              />
            </div>
          ) : null}
        </RsvpStatusPanel>
      ) : view === "error" ? (
        <RsvpStatusPanel
          icon={AlertCircle}
          iconColor="#ef4444"
          title={resolveText("rsvp_errorTitle")}
          message={resolveText("rsvp_errorMessage")}
          tokens={tokens}
        >
          <button
            onClick={() => setSubmitState("idle")}
            className="mt-2 px-6 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-80"
            style={rsvpRetryButtonStyle(tokens)}
          >
            {resolveText("rsvp_retryButton")}
          </button>
        </RsvpStatusPanel>
      ) : (
        <RsvpPageForm
          tokens={tokens}
          resolveText={resolveText}
          deadline={deadline}
          prefillName={prefillName}
          showEmail={showEmail}
          showDietaryRestrictions={showDietaryRestrictions}
          showCompanion={showCompanion}
          showNumAdults={showNumAdults}
          showNumChildren={showNumChildren}
          customFields={customFields}
          submitting={submitState === "loading"}
          onSubmit={onSubmit}
        />
      )}
    </RsvpPageShell>
  );
}
