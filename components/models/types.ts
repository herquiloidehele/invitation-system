import type { ComponentType, MutableRefObject, RefObject } from "react";
import type { InvitationData, InvitationStyles } from "@/lib/types";
import type { z } from "zod";

/**
 * Props passed to every model component.
 * Each model is a self-contained React component that renders the full invitation page
 * (everything inside the envelope — hero, sections, footer, etc.).
 *
 * `styles` uses InvitationStyles as the base type. Model components that extend
 * InvitationStyles with extra fields should cast internally:
 *   const myStyles = styles as MyModelStyles;
 */
export interface ModelComponentProps {
  /** The complete invitation data (couple, date, schedule, etc.). */
  invitation: InvitationData;
  /** Resolved visual styles for this invitation (colors, fonts, CTA, etc.).
   *  This is typed as InvitationStyles (the base contract shared components need).
   *  Models that define extended style types should cast internally. */
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

// ---------------------------------------------------------------------------
// Model Style Editor — props for each model's admin style editor component
// ---------------------------------------------------------------------------

/**
 * Props for model-specific style editor components.
 * Each model exports a StyleEditor that receives opaque styles and a generic
 * change callback. The editor casts styles to its own type internally.
 */
export interface ModelStyleEditorProps {
  /** Current styles object (opaque — each model casts to its own type). */
  styles: Record<string, unknown>;
  /** Callback to update a single top-level style field. */
  onStyleChange: (key: string, value: unknown) => void;
  /** Which accordion subsections to open by default. */
  defaultOpen?: string[];
}

// ---------------------------------------------------------------------------
// Model Registration — everything a model provides to the system
// ---------------------------------------------------------------------------

/**
 * Complete registration entry for a model.
 * The registry in index.ts maps component names to these entries.
 */
export interface ModelRegistration {
  /** The renderer component (lazily loaded). */
  component: ComponentType<ModelComponentProps>;
  /** Default styles used when creating a new invitation with this model. */
  defaultStyles: Record<string, unknown>;
  /** Optional Zod schema to validate styles on the API layer. */
  styleSchema?: z.ZodType<unknown>;
  /** Optional admin style editor component (lazily loaded).
   *  If not provided, the admin falls back to a generic JSON editor. */
  StyleEditor?: ComponentType<ModelStyleEditorProps>;
}
