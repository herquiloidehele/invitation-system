"use client";

import { useMemo, useSyncExternalStore } from "react";
import GuestListEditor from "@/components/admin/GuestListEditor";
import { DEFAULT_GUEST_MESSAGE_TEMPLATE } from "@/lib/guest-links";

interface GuestsTabClientProps {
  ownerToken: string;
  invitationSlug: string;
  messageTemplate: string;
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
}: GuestsTabClientProps) {
  const origin = useWindowOrigin();
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
      title="Lista de convidados"
    />
  );
}
