export type GalleryCategory =
  | "Todos"
  | "Casamentos"
  | "Save the Date"
  | "Baptizados"
  | "Aniversários";

export type GalleryItem = {
  title: string;
  category: Exclude<GalleryCategory, "Todos">;
  date: string;
  location: string;
  price: string;
  gradient: string;
};

export type FaqItem = {
  question: string;
  answer: string;
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
];

export const galleryItems: GalleryItem[] = [
  {
    title: "Leonor & Diogo",
    category: "Casamentos",
    date: "18 · Julho · 2026",
    location: "Quinta da Aroeira",
    price: "Desde 149€",
    gradient:
      "bg-[radial-gradient(circle_at_20%_20%,#B9C4B4_0,transparent_28%),radial-gradient(circle_at_82%_16%,#6B7E68_0,transparent_22%),linear-gradient(135deg,#E5E7E4,#C9D0C6)]",
  },
  {
    title: "Sara & Bruno",
    category: "Save the Date",
    date: "12 · Setembro · 2026",
    location: "Sintra",
    price: "Desde 149€",
    gradient:
      "bg-[radial-gradient(circle_at_50%_12%,#F3B36D_0,transparent_27%),linear-gradient(135deg,#F9D39A,#BFD0D1_55%,#EDE7D6)]",
  },
  {
    title: "Inês & Tomás",
    category: "Casamentos",
    date: "05 · Junho · 2026",
    location: "Évora",
    price: "Desde 149€",
    gradient:
      "bg-[radial-gradient(circle_at_70%_30%,#E7D8C5_0,transparent_28%),radial-gradient(circle_at_35%_70%,#C8A989_0,transparent_24%),linear-gradient(135deg,#F4EFE6,#D8D1C4)]",
  },
  {
    title: "Pequena Matilde",
    category: "Baptizados",
    date: "22 · Maio · 2026",
    location: "Cascais",
    price: "Desde 89€",
    gradient:
      "bg-[radial-gradient(circle_at_28%_40%,#F6B55D_0,transparent_22%),radial-gradient(circle_at_72%_28%,#E05B3C_0,transparent_18%),linear-gradient(135deg,#F9E6C8,#C8E0DF)]",
  },
  {
    title: "Marianna & Rui",
    category: "Casamentos",
    date: "30 · Abril · 2026",
    location: "Porto",
    price: "Desde 149€",
    gradient:
      "bg-[radial-gradient(circle_at_52%_32%,#F5D6DA_0,transparent_18%),radial-gradient(circle_at_32%_28%,#EFF4E8_0,transparent_26%),linear-gradient(135deg,#DDE7D4,#B7C7A7)]",
  },
  {
    title: "50 anos · Família Costa",
    category: "Aniversários",
    date: "15 · Agosto · 2026",
    location: "Algarve",
    price: "Desde 79€",
    gradient:
      "bg-[linear-gradient(110deg,#FFFFFF_0_18%,#2F6FB3_18%_21%,#FFFFFF_21%_38%,#E7B552_38%_41%,#FFFFFF_41%_100%)]",
  },
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
