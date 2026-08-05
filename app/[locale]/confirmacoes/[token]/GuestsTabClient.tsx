"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import GuestListEditor from "@/components/admin/GuestListEditor";
import { DEFAULT_GUEST_MESSAGE_TEMPLATE } from "@/lib/guest-links";
import type { OwnerGuestFormMode } from "@/lib/owner-guest-form-mode";

interface GuestsTabClientProps {
  ownerToken: string;
  invitationSlug: string;
  messageTemplate: string;
  /** Whether the host is allowed to add guests (Invitation.ownerCanAddGuests). */
  canAddGuests: boolean;
  ownerGuestFormMode: OwnerGuestFormMode;
}

/**
 * Subscribe to the browser window origin via `useSyncExternalStore`.
 * Server snapshot is empty string; client snapshot is the live origin.
 * This avoids `setState` inside `useEffect` (a React Compiler hard rule).
 */
function useWindowOrigin(): string {
  return useSyncExternalStore(
    () => () => {
      // No-op subscriber: the origin doesn't change during a session,
      // but we still need to provide a subscribe function.
    },
    () => window.location.origin,
    () => "",
  );
}

export default function GuestsTabClient({
  ownerToken,
  invitationSlug,
  messageTemplate,
  canAddGuests,
  ownerGuestFormMode,
}: GuestsTabClientProps) {
  const origin = useWindowOrigin();
  const t = useTranslations("OwnerConfirmations");
  const apiBasePath = useMemo(
    () => `/api/owner/${ownerToken}/guests`,
    [ownerToken],
  );

  return (
    <GuestListEditor
      apiBasePath={apiBasePath}
      invitationSlug={invitationSlug}
      invitationOrigin={origin}
      messageTemplate={messageTemplate || DEFAULT_GUEST_MESSAGE_TEMPLATE}
      title={t("guestsListTitle")}
      canAddGuests={canAddGuests}
      ownerGuestFormMode={ownerGuestFormMode}
    />
  );
}
