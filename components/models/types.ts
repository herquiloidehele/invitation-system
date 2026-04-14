import type { MutableRefObject, RefObject } from "react";
import type { InvitationData, InvitationStyles } from "@/lib/types";

/**
 * Props passed to every model component.
 * Each model is a self-contained React component that renders the full invitation page
 * (everything inside the envelope — hero, sections, footer, etc.).
 */
export interface ModelComponentProps {
  /** The complete invitation data (couple, date, schedule, etc.). */
  invitation: InvitationData;
  /** Resolved visual styles for this invitation (colors, fonts, CTA, etc.). */
  styles: InvitationStyles;
  /** Ref to the shared <audio> element managed by InvitationView. */
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  /** When provided, the model component should adopt this existing <video> element
   *  into the hero section instead of creating a new one, avoiding duplicate
   *  network requests. */
  prefetchedVideoRef?: RefObject<HTMLVideoElement | null>;
  /** Pass true in the admin live preview so all animations are always visible
   *  and respond to React state changes rather than scroll position. */
  isPreview?: boolean;
}
