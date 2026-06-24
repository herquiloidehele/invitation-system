import type { CSSProperties, ReactNode } from "react";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { efStyle, type EfTextKey } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";
import { Link } from "@/i18n/routing";

interface PillButtonProps {
  children: ReactNode;
  href?: string;
  /** When true and `href` is set, navigate internally via the locale-aware
   *  Link (no target=_blank) instead of an external anchor. */
  internal?: boolean;
  onClick?: () => void;
  /** Optional leading icon (e.g. a lucide `<MapPin size={15} />`). Inherits the
   *  button's text color via `currentColor`. */
  icon?: ReactNode;
  theme: Pick<
    TemplateTheme,
    "ctaPrimaryBg" | "ctaPrimaryText" | "ctaGlow" | "uiFont"
  >;
  className?: string;
  style?: CSSProperties;
  textStyles?: TextStyleOverrides | null;
  elementKey?: EfTextKey;
}

/** Filled rounded button/link (8px radius, gold fill, soft shadow) — the
 *  "Ver mapa" / "Itinerário" / "Ver Lista" style. */
export default function PillButton({
  children,
  href,
  internal = false,
  onClick,
  icon,
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
      borderRadius: 8,
      border: "none",
      color: theme.ctaPrimaryText,
      background: theme.ctaPrimaryBg,
      boxShadow: `0 4px 12px ${theme.ctaGlow ?? "rgba(140,106,28,0.25)"}`,
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

  const content = (
    <>
      {icon}
      <EditableText elementKey={elementKey}>{children}</EditableText>
    </>
  );

  if (href) {
    if (internal) {
      return (
        <Link href={href} className={className} style={css}>
          {content}
        </Link>
      );
    }
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
