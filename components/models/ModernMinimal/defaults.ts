import type { InvitationStyles } from "@/lib/types";

/** Default visual styles for the ModernMinimal model. */
export const DEFAULT_STYLES: InvitationStyles = {
  envelope: {
    base: "#F7F0E8",
    topFlap: "/images/top.png",
    bottomFlap: "/images/bottom.png",
  },
  bg: "#FAFAF7",
  cardBg: "rgba(255,255,255,0.5)",
  cardBorder: "rgba(44,44,44,0.06)",
  primary: "#2C2C2C",
  secondary: "#666666",
  accent: "#D4AF37",
  textPrimary: "#2C2C2C",
  textSecondary: "#888888",
  textMuted: "rgba(136,136,136,0.5)",
  displayFont: "'Playfair Display', serif",
  bodyFont: "'Cormorant Garamond', serif",
  uiFont: "'Outfit', sans-serif",
  ctaPrimaryBg: "#2C2C2C",
  ctaPrimaryText: "#FAFAF7",
  ctaSecondaryBorder: "#D4AF37",
  ctaSecondaryText: "#D4AF37",
  ctaRadius: "0px",
  monogramColor: "rgba(44,44,44,0.6)",
  tapTextColor: "rgba(44,44,44,0.5)",
  bgGradient:
    "radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.04) 0%, transparent 60%)",
  decorativeColor: "rgba(212,175,55,0.2)",
  ctaGlow: "rgba(44,44,44,0.12)",
};
