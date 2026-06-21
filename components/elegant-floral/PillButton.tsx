import type { CSSProperties, ReactNode } from "react";
import type { TemplateTheme } from "@/lib/types";

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
}

/** Rounded outline button/link — the "Ver mapa" / "Itinerário" / "Ver Lista" style. */
export default function PillButton({
  children,
  href,
  onClick,
  theme,
  className,
  style,
}: PillButtonProps) {
  const css: CSSProperties = {
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
  };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={css}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} style={css}>
      {children}
    </button>
  );
}
