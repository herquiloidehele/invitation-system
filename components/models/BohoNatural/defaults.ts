import type { InvitationStyles } from "@/lib/types";

/** Default visual styles for the BohoNatural model. */
export const DEFAULT_STYLES: InvitationStyles = {
  envelope: {
    base: "#F7F0E8",
    topFlap: "/images/top.png",
    bottomFlap: "/images/bottom.png",
  },
  bg: "#F3EBE1",
  cardBg: "rgba(255,255,255,0.42)",
  cardBorder: "rgba(160,113,90,0.08)",
  primary: "#A0715A",
  secondary: "#8B7355",
  accent: "#8B9A7A",
  textPrimary: "#A0715A",
  textSecondary: "#8B7355",
  textMuted: "rgba(139,115,85,0.35)",
  displayFont: "'Homemade Apple', cursive",
  bodyFont: "'Libre Baskerville', serif",
  scriptFont: "'Homemade Apple', cursive",
  uiFont: "'Outfit', sans-serif",
  ctaPrimaryBg: "#A0715A",
  ctaPrimaryText: "#FFFFFF",
  ctaSecondaryBorder: "#A0715A",
  ctaSecondaryText: "#A0715A",
  ctaRadius: "9999px",
  monogramColor: "rgba(255,255,255,0.8)",
  tapTextColor: "rgba(255,255,255,0.65)",
  bgGradient:
    "radial-gradient(ellipse at 50% 35%, rgba(139,154,122,0.06) 0%, transparent 65%)",
  decorativeColor: "rgba(139,154,122,0.22)",
  ctaGlow: "rgba(160,113,90,0.2)",
};
