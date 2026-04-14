import type { InvitationData } from "./types";

/**
 * Realistic Portuguese wedding invitation used for model previews.
 * All fields are populated so every section of the model component renders.
 */
export const MOCK_INVITATION: InvitationData = {
  slug: "preview",
  modelId: "model_classic_floral",
  modelComponent: "ClassicFloral",

  styles: {
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
    saveDateStyle: "classic",
  },

  couple: {
    bride: "Sofia",
    groom: "Miguel",
    monogram: "S&M",
  },

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
    googleMapsUrl: "https://maps.google.com",
    wazeUrl: "https://waze.com",
    latitude: 38.7978,
    longitude: -9.3905,
  },

  rsvp: {
    enabled: true,
    deadline: "2025-08-30",
  },

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

  giftRegistry: {
    enabled: true,
    text: "A vossa presença é o melhor presente. Se desejarem contribuir, temos uma lista simbólica.",
    link: "https://example.com",
  },

  audio: {
    enabled: false,
    src: "",
    artist: "",
    title: "",
  },

  heroImage:
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",

  faqs: [
    {
      question: "Posso trazer acompanhante?",
      answer:
        "O convite é nominativo. Se tiver alguma questão, entre em contacto connosco diretamente.",
    },
    {
      question: "Há estacionamento no local?",
      answer:
        "Sim, a Quinta dispõe de amplo parque de estacionamento gratuito para todos os convidados.",
    },
    {
      question: "Qual é o prazo para confirmar presença?",
      answer:
        "Pedimos que confirme até 30 de Agosto de 2025 para podermos organizar tudo da melhor forma.",
    },
  ],

  guestGuide: {
    enabled: true,
    items: [
      {
        id: "confirm-presence",
        label: "Confirme sua presença!",
        iconType: "lucide",
        iconName: "CheckCircle2",
      },
      {
        id: "no-photographer",
        label: "Não atrapalhe o fotógrafo!",
        iconType: "lucide",
        iconName: "Camera",
      },
      {
        id: "white-bride",
        label: "Branco é a cor da noiva!",
        iconType: "lucide",
        iconName: "Sparkles",
      },
      {
        id: "no-decor",
        label: "Não leve a decoração!",
        iconType: "lucide",
        iconName: "Flower",
      },
      {
        id: "no-plus-one",
        label: "Convidado não convida!",
        iconType: "lucide",
        iconName: "UserX",
      },
      {
        id: "wait-sweets",
        label: "Espere liberar a mesa dos doces!",
        iconType: "lucide",
        iconName: "Cake",
      },
      {
        id: "be-punctual",
        label: "Seja pontual!",
        iconType: "lucide",
        iconName: "Clock",
      },
      {
        id: "no-gossip",
        label: "Evite comentários maldosos!",
        iconType: "lucide",
        iconName: "MessageCircleOff",
      },
      {
        id: "attend-ceremony",
        label: "Vá também à cerimônia!",
        iconType: "lucide",
        iconName: "Church",
      },
      {
        id: "have-fun",
        label: "Divirta-se muito!",
        iconType: "lucide",
        iconName: "PartyPopper",
      },
      {
        id: "silent-phone",
        label: "Deixe o celular no silencioso!",
        iconType: "lucide",
        iconName: "BellOff",
      },
      {
        id: "say-goodbye",
        label: "Não saia sem se despedir dos noivos!",
        iconType: "lucide",
        iconName: "HeartHandshake",
      },
    ],
  },

  cinematicImageUrl: undefined,
  ourStory: {
    enabled: true,
    title: "Nossa História",
    description:
      "Conhecemo-nos num café em Lisboa, numa tarde chuvosa de Novembro. O que começou com um sorriso tímido transformou-se numa conversa que nunca mais acabou. Desde esse dia, partilhamos sonhos, aventuras e um amor que cresce a cada dia. Agora, queremos celebrar este novo capítulo convosco.",
  },
  invitationType: "standard",
};
