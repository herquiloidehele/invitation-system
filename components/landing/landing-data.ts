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
    text: "Anunciem a data com leveza, contagem decrescente e um primeiro vislumbre do que vem aí.",
    icon: "01",
  },
  {
    title: "Casamento",
    text: "O convite completo para o grande dia: história, programa, RSVP, mapa, música e detalhes úteis num só lugar.",
    icon: "02",
    featured: true,
  },
  {
    title: "Noivado",
    text: "Um convite íntimo para reunir as pessoas certas e marcar o início desta nova fase.",
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
    "Falamos sobre o vosso evento, o estilo que imaginam e o que querem que os convidados sintam. Recebem uma proposta clara no mesmo dia.",
  ],
  [
    "02",
    "Design à medida",
    "Recolhemos fotografias, textos e referências. Desenhamos um convite com o vosso ritmo, as vossas cores e a vossa história.",
  ],
  [
    "03",
    "Revisão & ajustes",
    "Comentam, ajustamos e refinamos convosco. Pequenas alterações ficam prontas rapidamente, sem complicar o processo.",
  ],
  [
    "04",
    "Publicação & partilha",
    "Colocamos o convite ao vivo, pronto a partilhar, com RSVP em tempo real num painel privado.",
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
