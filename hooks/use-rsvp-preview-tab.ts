"use client";

import { useCallback, useRef, useState } from "react";

export const RSVP_PAGE_ACCORDION_VALUE = "rsvp-page";

/**
 * Controlled preview-pane tab that jumps to the RSVP tab when the
 * "Página de confirmação" accordion item is expanded.
 */
export function useRsvpPreviewTab(initialTab = "invite") {
  const [previewTab, setPreviewTab] = useState(initialTab);
  const openRef = useRef<unknown[]>([]);

  const onAccordionChange = useCallback((values: unknown[]) => {
    const opened =
      values.includes(RSVP_PAGE_ACCORDION_VALUE) &&
      !openRef.current.includes(RSVP_PAGE_ACCORDION_VALUE);
    openRef.current = values;
    if (opened) setPreviewTab("rsvp");
  }, []);

  return { previewTab, setPreviewTab, onAccordionChange };
}
