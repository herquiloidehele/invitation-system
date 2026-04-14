import type { InvitationStyles } from "@/lib/types";

/** Default visual styles for the ClassicFloral model. */
export const DEFAULT_STYLES: InvitationStyles = {
  envelope: {
    base: "#f4f1e9",
    topFlap: "/images/top.png",
    bottomFlap: "/images/bottom.png",
  },
  bg: "#FEF7F2",
  cardBg: "rgba(255,255,255,0.65)",
  cardBorder: "rgba(201,169,98,0.08)",
  primary: "#8B1A4A",
  secondary: "#8B5E6B",
  accent: "#C4A050",
  textPrimary: "#8B1A4A",
  textSecondary: "#8B5E6B",
  textMuted: "rgba(139,94,107,0.45)",
  displayFont: "'Great Vibes', cursive",
  bodyFont: "'Cormorant Garamond', serif",
  scriptFont: "'Great Vibes', cursive",
  uiFont: "'Outfit', sans-serif",
  ctaPrimaryBg: "#C4A050",
  ctaPrimaryText: "#FFFFFF",
  ctaSecondaryBorder: "#8B1A4A",
  ctaSecondaryText: "#8B1A4A",
  ctaRadius: "9999px",
  monogramColor: "rgba(255,255,255,0.8)",
  tapTextColor: "rgba(255,255,255,0.7)",
  bgGradient:
    "radial-gradient(ellipse at 50% 30%, rgba(196,160,80,0.06) 0%, transparent 70%)",
  decorativeColor: "rgba(196,160,80,0.18)",
  ctaGlow: "rgba(196,160,80,0.25)",
};
