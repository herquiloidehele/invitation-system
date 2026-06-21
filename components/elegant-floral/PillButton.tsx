import type { CSSProperties, ReactNode } from "react";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { efStyle, type EfTextKey } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";

interface PillButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  theme: Pick<
    TemplateTheme,
    "ctaSecondaryBorder" | "ctaSecondaryText" | "uiFont"
  >;
  className?: string;
  style?: CSSProperties;
  textStyles?: TextStyleOverrides | null;
  elementKey?: EfTextKey;
}

/** Rounded outline button/link — the "Ver mapa" / "Itinerário" / "Ver Lista" style. */
export default function PillButton({
  children,
  href,
  onClick,
  theme,
  className,
  style,
  textStyles,
  elementKey = "efPill",
}: PillButtonProps) {
  const css: CSSProperties = efStyle(
    {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "9px 26px",
      borderRadius: 9999,
      border: `1px solid ${theme.ctaSecondaryBorder}`,
      color: theme.ctaSecondaryText,
      background: "transparent",
      fontFamily: theme.uiFont,
      fontSize: 13,
      letterSpacing: "0.06em",
      lineHeight: 1,
      textDecoration: "none",
      cursor: "pointer",
      whiteSpace: "nowrap",
      ...style,
    },
    textStyles,
    elementKey,
  );

  const content = <EditableText elementKey={elementKey}>{children}</EditableText>;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={css}
      >
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} style={css}>
      {content}
    </button>
  );
}
