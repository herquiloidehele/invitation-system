import type { InvitationStyles } from "@/lib/types";

/**
 * ModernMinimal uses the base InvitationStyles as-is.
 * Future models can define their own style interface that extends or replaces it.
 *
 * Example for a hypothetical BoldTypography model:
 *   export interface BoldTypographyStyles extends InvitationStyles {
 *     headlineSize: number;
 *     motionPreset: "bounce" | "slide" | "fade";
 *     layoutDensity: "compact" | "spacious";
 *   }
 */
export type ModernMinimalStyles = InvitationStyles;
