import type { InvitationStyles } from "@/lib/types";

/** Default visual styles for the MidnightLuxe model. */
export const DEFAULT_STYLES: InvitationStyles = {
  envelope: {
    base: "#F7F0E8",
    topFlap: "/images/top.png",
    bottomFlap: "/images/bottom.png",
  },
  bg: "#080C16",
  cardBg: "rgba(255,255,255,0.025)",
  cardBorder: "rgba(255,215,0,0.08)",
  primary: "#FFFFFF",
  secondary: "rgba(255,215,0,0.38)",
  accent: "#FFD700",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.42)",
  textMuted: "rgba(255,255,255,0.19)",
  displayFont: "'Cinzel', serif",
  bodyFont: "'Lora', serif",
  uiFont: "'Outfit', sans-serif",
  ctaPrimaryBg: "#FFD700",
  ctaPrimaryText: "#080C16",
  ctaSecondaryBorder: "#FFD700",
  ctaSecondaryText: "#FFD700",
  ctaRadius: "0px",
  monogramColor: "rgba(255,215,0,0.6)",
  tapTextColor: "rgba(255,215,0,0.5)",
  bgGradient:
    "radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.03) 0%, transparent 60%)",
  decorativeColor: "rgba(255,215,0,0.15)",
  ctaGlow: "rgba(255,215,0,0.18)",
};
