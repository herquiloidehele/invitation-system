import type { GalleryCategory as DbGalleryCategory } from "@/lib/landing-features";

export type GalleryCategory =
  | "Todos"
  | "Casamentos"
  | "Save the Date"
  | "Baptizados"
  | "Aniversários"
  | "Noivado";

export type FaqItem = {
  question: string;
  answer: string;
};

export const dbCategoryToTab: Record<DbGalleryCategory, GalleryCategory> = {
  wedding: "Casamentos",
  save_the_date: "Save the Date",
  baptism: "Baptizados",
  anniversary: "Aniversários",
  engagement: "Noivado",
};

export const navLinks = [
  { label: "Tipos", href: "#tipos" },
  { label: "Galeria", href: "#galeria" },
  { label: "Como funciona", href: "#processo" },
  { label: "Recursos", href: "#recursos" },
  { label: "FAQ", href: "#faq" },
];

export const invitationTypes = [
  {
    title: "Save The Date",
    text: "Anuncie a data com elegância. Vídeo, contagem decrescente e partilha simples.",
    icon: "01",
  },
  {
    title: "Casamento",
    text: "O convite completo: história, programa, RSVP, mapa e mensagens.",
    icon: "02",
    featured: true,
  },
  {
    title: "Noivado",
    text: "Convite suave e tocante para o primeiro grande dia, com todos os detalhes essenciais.",
    icon: "03",
  },
];

export const galleryCategories: GalleryCategory[] = [
  "Todos",
  "Casamentos",
  "Save the Date",
  "Baptizados",
  "Aniversários",
  "Noivado",
];

export const processSteps = [
  [
    "01",
    "Conversa inicial",
    "Falamos sobre o vosso evento, estilo e expectativas. Recebem uma proposta clara no mesmo dia.",
  ],
  [
    "02",
    "Design à medida",
    "Recolhemos fotos e textos. Desenhamos o convite com o ADN do vosso evento.",
  ],
  [
    "03",
    "Revisão & ajustes",
    "Comentam, ajustamos e refinamos. Pequenas alterações ficam prontas rapidamente.",
  ],
  [
    "04",
    "Publicação & partilha",
    "Convite ao vivo, link partilhável e RSVP em tempo real num painel privado.",
  ],
] as const;

export const faqs: FaqItem[] = [
  {
    question: "Quanto tempo demora?",
    answer:
      "Tipicamente 3 a 5 dias úteis depois de recebermos fotografias e textos. Para datas próximas, fazemos versões expressas em 48h.",
  },
  {
    question: "Posso usar para outros eventos além de casamento?",
    answer:
      "Sim. Adaptamos a experiência para save the date, baptizados, noivados, aniversários e celebrações privadas.",
  },
  {
    question: "Como funciona o RSVP?",
    answer:
      "Os convidados confirmam directamente no convite. Acompanham tudo num painel privado, em tempo real.",
  },
  {
    question: "Posso enviar a convidados individuais?",
    answer:
      "Sim. Cada convidado pode receber um link personalizado com nomes, mesa e detalhes específicos.",
  },
  {
    question: "Posso editar depois de publicado?",
    answer:
      "Sim. Ajustes de texto, horários, mapas e detalhes podem ser actualizados depois da publicação.",
  },
  {
    question: "Quanto custa?",
    answer:
      "Depende do nível de personalização, conteúdos e funcionalidades. Enviamos uma proposta clara no mesmo dia.",
  },
];
