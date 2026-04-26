import SaveTheDateThemeForm from "../SaveTheDateThemeForm";
import type { STDThemeFormData } from "../SaveTheDateThemeForm";

export const dynamic = "force-dynamic";

export default function NewSaveTheDateThemePage() {
  const initialData: STDThemeFormData = {
    name: "",
    label: "",
    description: "",
    heartColor: "#D4AF37",
    heartGlitterColors: ["#D4AF37", "#C5A028", "#E8C547", "#F5E6A3", "#FFFFFF"],
    rsvpButtonBgColor: "#8B7536",
    heartTextureUrl: "",
    bgColor: "#FFFFFF",
    titleFont: "'Great Vibes', cursive",
    coupleFont: "'Cormorant Garamond', serif",
    dateFont: "'Cormorant Garamond', serif",
    textColor: "#2C2C2C",
    confettiColors: ["#D4AF37", "#C5A028", "#E8C547", "#F5E6A3", "#8B7536"],
    envelope: { base: "#F7F0E8", topFlap: "/images/top.png", bottomFlap: "/images/bottom.png" },
  };

  return (
    <SaveTheDateThemeForm mode="create" initialData={initialData} />
  );
}
