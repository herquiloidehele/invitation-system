import { notFound } from "next/navigation";
import { getModel } from "@/lib/models";
import { getDefaultStylesForComponent } from "@/components/models";
import type { InvitationData } from "@/lib/types";
import ThemeViewClient from "./ThemeViewClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function ThemeViewPage({ params }: PageProps) {
  const { name } = await params;

  const model = await getModel(name);
  if (!model) notFound();

  // Build a minimal preview invitation with default styles so every
  // section of the model component renders with placeholder values.
  const invitation: InvitationData = {
    slug: "preview",
    modelId: model.id,
    modelComponent: model.component,
    styles: getDefaultStylesForComponent(model.component),
    invitationType: "standard",
    couple: { bride: "Ana", groom: "Miguel", monogram: "A&M" },
    date: {
      iso: "2025-09-20T17:00:00",
      display: "20 de Setembro de 2025",
      dayOfWeek: "Sábado",
      time: "17:00",
      day: "20",
      month: "Setembro",
      year: "2025",
    },
    quote:
      "Dois corações, uma história — queremos partilhar este momento único convosco.",
    location: {
      name: "Quinta do Lago Azul",
      address: "Rua das Amendoeiras, 45 — Sintra, Lisboa",
      googleMapsUrl: "",
      wazeUrl: "",
      latitude: 38.7978,
      longitude: -9.3905,
    },
    rsvp: { enabled: true, deadline: "2025-08-30" },
    schedule: [
      { time: "17:00", label: "Cerimônia", venue: "Capela da Quinta" },
      { time: "18:30", label: "Cocktail", venue: "Jardim das Rosas" },
      { time: "20:00", label: "Jantar", venue: "Salão Principal" },
      { time: "00:00", label: "Festa", venue: "Terraço com Vista" },
    ],
    dressCode: {
      enabled: true,
      text: "Traje Formal",
      colors: ["#000000", "#1a1a2e", "#d4af37"],
    },
    giftRegistry: { enabled: false, text: "", link: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "",
  };

  return <ThemeViewClient invitation={invitation} model={model} />;
}
