import type { CSSProperties, ReactNode } from "react";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { mbStyle, mbTokens, type MbTextKey } from "@/lib/minimalism-brown";
import { EditableText } from "@/components/shared/EditableText";

interface SectionTitleProps {
  children: ReactNode;
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides | null;
  as?: "h2" | "h3";
  /** Inverted sections (the reception panel) pass the panel foreground. */
  color?: string;
  elementKey?: MbTextKey;
  style?: CSSProperties;
}

/**
 * Tracked uppercase serif section header ("CEREMONY INFO", "DRESS CODE").
 *
 * Size and weight come from the theme's section-title role via mbTokens, so
 * changing them in the admin moves every section heading at once.
 */
export default function SectionTitle({
  children,
  theme,
  textStyles,
  as: Tag = "h2",
  color,
  elementKey = "mbSectionTitle",
  style,
}: SectionTitleProps) {
  const t = mbTokens(theme);
  const base: CSSProperties = {
    margin: 0,
    textAlign: "center",
    fontFamily: t.title.font,
    fontWeight: t.title.weight,
    fontSize: t.title.size,
    letterSpacing: `${t.title.tracking}px`,
    textTransform: "uppercase",
    lineHeight: 1.2,
    color: color ?? theme.textPrimary,
    ...style,
  };

  // Always wrap: EditableText is a passthrough on the public page and becomes
  // selectable in the admin preview.
  return (
    <Tag style={mbStyle(base, textStyles, elementKey)}>
      <EditableText elementKey={elementKey}>{children}</EditableText>
    </Tag>
  );
}
