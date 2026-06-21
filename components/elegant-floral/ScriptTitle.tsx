import type { CSSProperties, ReactNode } from "react";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { efStyle, type EfTextKey } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";

interface ScriptTitleProps {
  children: ReactNode;
  theme: Pick<
    TemplateTheme,
    "sectionTitleFont" | "scriptFont" | "displayFont" | "primary"
  >;
  as?: "h2" | "h3";
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  /** Per-invitation text overrides; pass to make the title inline-editable. */
  textStyles?: TextStyleOverrides | null;
  /** Inline-editor key. Defaults to "efSectionTitle" when textStyles is given. */
  elementKey?: EfTextKey;
}

/** Gold calligraphy section header (e.g. "Cronograma", "Presentes"). */
export default function ScriptTitle({
  children,
  theme,
  as: Tag = "h2",
  size = "clamp(1.8rem, 7vw, 2.5rem)",
  className,
  style,
  textStyles,
  elementKey = "efSectionTitle",
}: ScriptTitleProps) {
  const base: CSSProperties = {
    margin: 0,
    textAlign: "center",
    fontFamily: theme.sectionTitleFont ?? theme.scriptFont ?? theme.displayFont,
    fontWeight: 400,
    fontSize: size,
    lineHeight: 1.1,
    color: theme.primary,
    ...style,
  };

  // Always wrap: EditableText is a zero-overhead passthrough on the public page
  // (no editor context) and becomes selectable in the admin preview.
  return (
    <Tag className={className} style={efStyle(base, textStyles, elementKey)}>
      <EditableText elementKey={elementKey}>{children}</EditableText>
    </Tag>
  );
}
