import type { InvitationData } from "./types";

/**
 * Realistic Portuguese wedding invitation used for model previews.
 * All fields are populated so every section of the model component renders.
 */
export const MOCK_INVITATION: InvitationData = {
  slug: "preview",
  modelId: "model_modern_minimal",
  modelComponent: "ModernMinimal",

  styles: {
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
