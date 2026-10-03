import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type { RsvpPageTokens } from "@/lib/rsvp-page-style";

export function RsvpStatusPanel({
  icon: Icon,
  iconColor,
  title,
  message,
  tokens,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  message: string;
  tokens: RsvpPageTokens;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <Icon size={44} strokeWidth={1.3} style={{ color: iconColor }} />
      <p className="text-lg font-medium" style={{ color: tokens.colors.title }}>
        {title}
      </p>
      <p className="text-sm" style={{ color: tokens.colors.text }}>
        {message}
      </p>
      {children}
    </div>
  );
}

export function rsvpRetryButtonStyle(tokens: RsvpPageTokens): CSSProperties {
  return {
    background: tokens.colors.buttonBg,
    color: tokens.colors.buttonText,
    borderRadius: tokens.radius.button,
  };
}
