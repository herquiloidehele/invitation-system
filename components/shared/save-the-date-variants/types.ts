import type {
  CustomTexts,
  ImageSettingsMap,
  InvitationData,
  TemplateTheme,
} from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";

/**
 * Props every SaveTheDate variant accepts. Each variant is allowed to
 * ignore fields it doesn't need (e.g. only `cinematic` reads
 * `imageSettings`); they all share the same shape so the dispatcher
 * can spread props uniformly.
 *
 * NOTE: `cardBg` and `cardBorder` overrides are already merged into the
 * `theme` argument by the dispatcher, so variants should read
 * `theme.cardBg` / `theme.cardBorder` directly instead of taking
 * `cardBg` / `cardBorder` props.
 */
export interface SaveTheDateVariantProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  cardBorderRadius?: number;
  onCalendarClick?: () => void;
  isPreview?: boolean;
  imageSettings?: ImageSettingsMap;
  customTexts?: CustomTexts;
}
