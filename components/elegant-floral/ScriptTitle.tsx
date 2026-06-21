import type { CSSProperties, ReactNode } from "react";
import type { TemplateTheme } from "@/lib/types";

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
}

/** Gold calligraphy section header (e.g. "Cronograma", "Presentes"). */
export default function ScriptTitle({
  children,
  theme,
  as: Tag = "h2",
  size = "clamp(1.8rem, 7vw, 2.5rem)",
  className,
  style,
}: ScriptTitleProps) {
  return (
    <Tag
      className={className}
      style={{
        margin: 0,
        textAlign: "center",
        fontFamily:
          theme.sectionTitleFont ?? theme.scriptFont ?? theme.displayFont,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.1,
        color: theme.primary,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
