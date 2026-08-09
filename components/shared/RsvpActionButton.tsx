import type { ButtonHTMLAttributes } from "react";

import { resolveTextElementOverride } from "@/lib/curtain-canva";
import {
  resolveRsvpSubmitStyle,
  type RsvpInputRenderer,
  type RsvpInputStyle,
} from "@/lib/rsvp-input-styles";
import type { TextStyleOverrides } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RsvpActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  inputStyle?: RsvpInputStyle;
  backgroundColor: string;
  textColor: string;
  radius: string;
  accentColor: string;
  fontFamily: string;
  textStyles?: TextStyleOverrides;
  renderer?: RsvpInputRenderer;
}

export default function RsvpActionButton({
  inputStyle,
  backgroundColor,
  textColor,
  radius,
  accentColor,
  fontFamily,
  textStyles,
  renderer,
  className,
  style,
  children,
  ...buttonProps
}: RsvpActionButtonProps) {
  const resolved = resolveRsvpSubmitStyle(
    inputStyle,
    {
      backgroundColor,
      textColor,
      radius,
      accentColor,
    },
    renderer,
  );
  const labelStyle = resolveTextElementOverride(textStyles, "ctaLabel");

  return (
    <button
      className={cn(resolved.className, className)}
      style={{
        fontFamily,
        ...resolved.style,
        ...labelStyle,
        ...style,
      }}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
