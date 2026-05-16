"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  buildContactMessage,
  buildWhatsappUrl,
  DEFAULT_WHATSAPP_MESSAGE,
  DISPLAY_WHATSAPP_NUMBER,
  type ContactMessageFields,
} from "@/lib/landing-whatsapp";

type GalleryCategory =
  | "Todos"
  | "Casamentos"
  | "Save the Date"
  | "Baptizados"
  | "Aniversários";

type GalleryItem = {
  title: string;
  category: Exclude<GalleryCategory, "Todos">;
  date: string;
  location: string;
  price: string;
  gradient: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const navLinks = [
  { label: "Tipos", href: "#tipos" },
  { label: "Galeria", href: "#galeria" },
  { label: "Como funciona", href: "#processo" },
  { label: "Recursos", href: "#recursos" },
  { label: "FAQ", href: "#faq" },
];

const invitationTypes = [
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

const galleryCategories: GalleryCategory[] = [
  "Todos",
  "Casamentos",
  "Save the Date",
  "Baptizados",
  "Aniversários",
];

const galleryItems: GalleryItem[] = [
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

const processSteps = [
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

const faqs: FaqItem[] = [
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

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#3F4E3F]">
      <span className="h-px w-8 bg-[#3F4E3F]" />
      {children}
    </div>
  );
}

function AnimatedSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 36 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function BrindealHomepage() {
  const reduceMotion = useReducedMotion();
  const [activeGalleryCategory, setActiveGalleryCategory] =
    useState<GalleryCategory>("Todos");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [formState, setFormState] = useState<ContactMessageFields>({
    name: "",
    eventType: "",
    date: "",
    guests: "",
    message: "",
  });

  const visibleGalleryItems = useMemo(
    () =>
      activeGalleryCategory === "Todos"
        ? galleryItems
        : galleryItems.filter((item) => item.category === activeGalleryCategory),
    [activeGalleryCategory],
  );

  function updateFormField(field: keyof ContactMessageFields, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.open(
      buildWhatsappUrl(buildContactMessage(formState)),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <main className="overflow-hidden bg-white font-[var(--font-outfit)] text-[#1F2420]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E5E7E4]/80 bg-white/85 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            className="flex items-center gap-2 font-semibold tracking-[-0.03em] text-[#1F2420] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#3F4E3F]" />
            <span className="text-xl">brindeal</span>
          </a>
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#5C605A] transition hover:text-[#1F2420] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
              >
                {link.label}
              </a>
            ))}
          </div>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#3F4E3F] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            Pedir orçamento →
          </a>
        </nav>
      </header>

      <section
        id="top"
        className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[0.95fr_1fr] lg:gap-16 lg:pt-24"
      >
        <div className="absolute left-1/2 top-24 -z-0 h-72 w-72 rounded-full bg-[#E8EBE7] blur-3xl" />
        <HeroCopy reduceMotion={reduceMotion} />
        <HeroPhone reduceMotion={reduceMotion} />
      </section>

      <TypesSection />
      <GallerySection
        activeCategory={activeGalleryCategory}
        onCategoryChange={setActiveGalleryCategory}
        items={visibleGalleryItems}
      />
      <ProcessSection />
      <FeaturesSection />
      <LiveDemoSection />
      <FaqSection openIndex={openFaqIndex} setOpenIndex={setOpenFaqIndex} />
      <ContactSection
        formState={formState}
        onFieldChange={updateFormField}
        onSubmit={handleContactSubmit}
      />
      <Footer />
    </main>
  );
}

function HeroCopy({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative z-10 max-w-3xl lg:pt-10"
    >
      <SectionEyebrow>Convites digitais · Lisboa</SectionEyebrow>
      <h1 className="mt-8 text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-[#3F4E3F] sm:text-6xl lg:text-7xl">
        <span className="block">O seu convite</span>
        <span className="block">digital</span>
        <span className="mt-5 block font-medium text-[#2D2D23]">
          Já está aqui
        </span>
      </h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5C605A]">
        Convites digitais elegantes, interactivos e personalizados, feitos à
        medida para o seu evento. RSVP em tempo real, música, mapa e gestão de
        convidados.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <a
          href={buildWhatsappUrl(DEFAULT_WHATSAPP_MESSAGE)}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#3F4E3F] px-7 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_60px_rgba(63,78,63,0.24)] transition hover:-translate-y-0.5 hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
        >
          Pedir orçamento →
        </a>
        <a
          href="#galeria"
          className="rounded-full border border-[#E5E7E4] px-7 py-4 text-center text-sm font-semibold text-[#1F2420] transition hover:-translate-y-0.5 hover:border-[#3F4E3F] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
        >
          Ver galeria
        </a>
      </div>
      <p className="mt-8 text-sm font-medium text-[#5C605A]">
        ★★★★★ &nbsp; 5.0 · +200 casais felizes em Portugal
      </p>
    </motion.div>
  );
}

function HeroPhone({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.div
      animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="relative z-10 mx-auto aspect-[9/16] w-full max-w-[17rem] overflow-hidden rounded-[2.75rem] border-[6px] border-[#3F4E3F] bg-[#FAFBF9] shadow-[0_35px_100px_rgba(31,36,32,0.16)] sm:max-w-[19rem] lg:max-w-[21rem]"
    >
      <Image
        src="/images/demo-invite.jpg"
        alt="Pré-visualização de convite digital Brindeal"
        fill
        priority
        sizes="(min-width: 1024px) 360px, 80vw"
        className="object-cover"
      />
    </motion.div>
  );
}

function TypesSection() {
  return (
    <AnimatedSection id="tipos" className="bg-[#F6F7F5] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Para cada celebração</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            Um convite para cada momento
          </h2>
          <p className="mt-5 text-[#5C605A]">
            Adapte o convite ao tipo de celebração. Cada modelo é refinado,
            único e pensado para emocionar.
          </p>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {invitationTypes.map((type) => (
            <motion.article
              key={type.title}
              whileHover={{ y: -8 }}
              className={`rounded-[1.5rem] p-7 transition ${
                type.featured
                  ? "bg-[#3F4E3F] text-white shadow-[0_24px_80px_rgba(63,78,63,0.24)]"
                  : "border border-[#E5E7E4] bg-white text-[#1F2420] shadow-[0_12px_40px_rgba(31,36,32,0.05)]"
              }`}
            >
              <div
                className={`mb-8 flex h-13 w-13 items-center justify-center rounded-2xl text-sm font-bold ${
                  type.featured
                    ? "bg-white/15 text-white"
                    : "bg-[#F6F7F5] text-[#3F4E3F]"
                }`}
              >
                {type.icon}
              </div>
              <h3 className="text-2xl font-semibold">{type.title}</h3>
              <p
                className={`mt-4 text-sm leading-6 ${
                  type.featured ? "text-[#E8EBE7]" : "text-[#5C605A]"
                }`}
              >
                {type.text}
              </p>
              <a
                href={buildWhatsappUrl(`Olá! Gostava de saber mais sobre ${type.title}.`)}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
              >
                Saber mais <span aria-hidden="true">→</span>
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

function GallerySection({
  activeCategory,
  onCategoryChange,
  items,
}: {
  activeCategory: GalleryCategory;
  onCategoryChange: (category: GalleryCategory) => void;
  items: GalleryItem[];
}) {
  return (
    <AnimatedSection id="galeria" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <SectionEyebrow>Galeria</SectionEyebrow>
            <h2 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
              Histórias que inspiram
            </h2>
            <p className="mt-5 max-w-3xl text-[#5C605A]">
              Convites reais de casais reais. Cada projecto contado com
              sensibilidade.
            </p>
          </div>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-full border border-[#E5E7E4] px-6 py-3 text-sm font-semibold transition hover:border-[#3F4E3F] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            Ver tudo →
          </a>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {galleryCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4 ${
                activeCategory === category
                  ? "bg-[#3F4E3F] text-white"
                  : "border border-[#E5E7E4] text-[#1F2420] hover:border-[#3F4E3F]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <motion.div layout className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.article
                key={item.title}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="group overflow-hidden rounded-[1.5rem] border border-[#E5E7E4] bg-white shadow-[0_12px_40px_rgba(31,36,32,0.045)]"
              >
                <div className={`relative h-72 overflow-hidden ${item.gradient}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.42),transparent_22%),linear-gradient(to_bottom,transparent_55%,rgba(31,36,32,0.16))] transition duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 text-[11px] font-bold tracking-[0.14em] text-[#3F4E3F] shadow-sm">
                    {item.category === "Casamentos"
                      ? "Casamento"
                      : item.category === "Save the Date"
                        ? "Save the Date"
                        : item.category === "Aniversários"
                          ? "Aniversário"
                          : item.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#1F2420]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-[#5C605A]">
                    {item.date} · {item.location}
                  </p>
                  <p className="mt-2 text-base font-bold text-[#3F4E3F]">
                    {item.price}
                  </p>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

function ProcessSection() {
  const badges = ["No mesmo dia", "3 a 5 dias úteis", "Iterativo", "Ao vivo"];

  return (
    <AnimatedSection id="processo" className="bg-[#F6F7F5] px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Processo</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            Quatro passos. Zero stress.
          </h2>
          <p className="mt-5 text-[#5C605A]">
            Do primeiro contacto à publicação. Tratamos de tudo. Vocês
            aproveitam.
          </p>
        </div>
        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {processSteps.map(([number, title, text], index) => {
            const dark = index === 0;

            return (
              <article
                key={number}
                className={`min-h-[320px] rounded-[1.5rem] p-7 shadow-[0_18px_55px_rgba(31,36,32,0.05)] sm:p-8 ${
                  dark
                    ? "bg-[#3F4E3F] text-white"
                    : "border border-[#E5E7E4] bg-white text-[#1F2420]"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <p className={`text-5xl font-semibold leading-none ${dark ? "text-white" : "text-[#3F4E3F]"}`}>
                    <span className="text-lg">•</span>{" "}
                    {number}
                  </p>
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl text-lg ${
                      dark ? "bg-white/12 text-white" : "bg-[#F6F7F5] text-[#3F4E3F]"
                    }`}
                    aria-hidden="true"
                  >
                    {index === 0 ? "✉" : index === 1 ? "✦" : index === 2 ? "◐" : "↗"}
                  </span>
                </div>
                <h3 className="mt-7 text-2xl font-semibold tracking-[-0.02em]">
                  {title}
                </h3>
                <p className={`mt-5 text-sm leading-7 ${dark ? "text-[#E8EBE7]" : "text-[#5C605A]"}`}>
                  {text}
                </p>
                <span
                  className={`mt-6 inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] ${
                    dark
                      ? "bg-white/14 text-white"
                      : "border border-[#E5E7E4] bg-white text-[#1F2420]"
                  }`}
                >
                  • {badges[index]}
                </span>
                <ProcessPreview index={index} />
              </article>
            );
          })}
        </div>
        <div className="mt-14 flex flex-col items-center justify-center gap-5 text-center sm:flex-row">
          <p className="text-2xl font-medium text-[#1F2420]">
            Pronto para começar a vossa história?
          </p>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#3F4E3F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            Falar agora →
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}

function ProcessPreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-[#243326]/75 p-4 text-xs text-white">
        <div className="w-fit rounded-full bg-white px-4 py-2 text-[#1F2420]">
          Olá, é casamento em Julho
        </div>
        <div className="mt-2 w-fit rounded-full bg-white/12 px-4 py-2">
          Perfeito! Envio proposta hoje
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="mt-6 rounded-2xl bg-[#F6F7F5] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5C605A]">
          Paleta
        </p>
        <div className="mt-3 flex gap-3">
          {["#3F4E3F", "#6B7E68", "#E8EBE7", "#DEE1DC"].map((color) => (
            <span key={color} className="h-9 w-9 rounded-lg" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="mt-6 rounded-2xl bg-[#F6F7F5] p-4">
        <div className="space-y-3">
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <span className={`h-5 w-5 rounded-full ${row === 0 ? "bg-[#3F4E3F]" : "bg-[#DEE1DC]"}`} />
              <span className="h-2 w-24 rounded-full bg-[#DEE1DC]" />
              <span className="h-2 w-16 rounded-full bg-[#E5E7E4]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#F6F7F5] p-4 text-xs text-[#1F2420]">
      <div className="grid h-20 w-12 place-items-center rounded-lg border-3 border-[#3F4E3F] bg-white">
        <span className="h-4 w-4 rounded-full bg-[#3F4E3F]" />
      </div>
      <div className="space-y-2">
        <p>• 142 confirmaram</p>
        <p>• 18 mensagens</p>
        <p>• em tempo real</p>
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <AnimatedSection id="recursos" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Recursos</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            Tudo o que precisa, num só link.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <article className="min-h-[360px] rounded-[1.75rem] bg-[#3F4E3F] p-8 text-white sm:p-10 lg:col-span-7 lg:min-h-[430px]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F6F7F5]">
              • Favorito dos noivos
            </p>
            <h3 className="mt-7 text-4xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl">
              RSVP em tempo real
            </h3>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#E8EBE7] sm:text-base">
              Os convidados confirmam, escolhem ementa, deixam mensagem.
              Acompanham tudo num painel privado, sincronizado ao minuto.
            </p>
            <div className="mt-24 rounded-2xl bg-[#243326]/70 p-5 backdrop-blur sm:mt-28">
              <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-[#F6F7F5]">
                <span>Confirmações recebidas</span>
                <span>142 / 150</span>
              </div>
              <div className="mt-5 h-2 rounded-full bg-black/20">
                <div className="h-full w-[92%] rounded-full bg-[#6B7E68]" />
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex -space-x-2">
                  {["#6B7E68", "#F6F7F5", "#F6F7F5", "#9AA795"].map(
                    (color, index) => (
                      <span
                        key={`${color}-${index}`}
                        className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#243326] text-[9px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {index === 3 ? "+138" : ""}
                      </span>
                    ),
                  )}
                </div>
                <span className="text-xs text-[#E8EBE7]">actualizado agora</span>
              </div>
            </div>
          </article>

          <div className="grid gap-5 lg:col-span-5">
            <FeatureWideCard
              icon="♫"
              title="Música ambiente"
              text="Spotify, YouTube ou ficheiro próprio."
              visual={<AudioWave />}
            />
            <FeatureWideCard
              icon="◎"
              title="Mapa interactivo"
              text="Direcções, GPS e estacionamento."
              visual={<MapTarget />}
            />
          </div>

          <FeatureSmallCard title="Gestão de convidados" text="Lista com mesa, link pessoal e acompanhantes.">
            <div className="mt-5 space-y-2 rounded-xl bg-[#F6F7F5] p-2">
              {["Leonor S.", "Diogo M.", "Sara F."].map((name, index) => (
                <div key={name} className="flex items-center justify-between rounded-lg bg-white px-2 py-1.5 text-xs">
                  <span className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full ${index === 2 ? "bg-[#E5E7E4]" : "bg-[#3F4E3F]"}`} />
                    {name}
                  </span>
                  <span className="rounded-full bg-[#3F4E3F] px-2 py-0.5 text-[10px] font-semibold text-white">
                    Mesa {index === 2 ? 3 : 1}
                  </span>
                </div>
              ))}
            </div>
          </FeatureSmallCard>

          <FeatureSmallCard title="Analytics" text="Quem abriu, confirmou e respondeu.">
            <div className="mt-5 rounded-xl bg-[#F6F7F5] p-4">
              <div className="flex h-20 items-end justify-between gap-3">
                {[22, 40, 30, 48, 63, 54, 78].map((height, index) => (
                  <span
                    key={index}
                    className="w-4 rounded-sm bg-[#657661]"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#3F4E3F]">
              +38% <span className="text-xs font-normal text-[#5C605A]">esta semana</span>
            </p>
          </FeatureSmallCard>

          <FeatureSmallCard
            title="Multi-idioma"
            text="PT, EN, ES para convidados internacionais."
            tinted
          >
            <div className="mt-5 space-y-2">
              {["Português", "English", "Español"].map((language) => (
                <div key={language} className="flex items-center justify-between rounded-xl bg-white px-4 py-2 text-sm">
                  {language}
                  <span>✓</span>
                </div>
              ))}
            </div>
          </FeatureSmallCard>

          <FeatureSmallCard title="Personalização total" text="Tipografia, cores e fotografias sob medida.">
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5C605A]">
              Paleta
            </p>
            <div className="mt-3 flex gap-2">
              {["#3F4E3F", "#2D3A2D", "#E8EBE7", "#DEE1DC"].map((color) => (
                <span key={color} className="h-8 w-8 rounded-lg" style={{ backgroundColor: color }} />
              ))}
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5C605A]">
              Tipografia
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#1F2420]">
              Aa <span className="text-2xl font-normal">Aa</span>
            </p>
          </FeatureSmallCard>
        </div>
      </div>
    </AnimatedSection>
  );
}

function FeatureWideCard({
  icon,
  title,
  text,
  visual,
}: {
  icon: string;
  title: string;
  text: string;
  visual: React.ReactNode;
}) {
  return (
    <article className="grid min-h-[205px] grid-cols-[1fr_auto] items-center gap-6 rounded-[1.75rem] border border-[#E5E7E4] bg-white p-7 shadow-[0_12px_40px_rgba(31,36,32,0.035)] sm:p-8">
      <div>
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-[#F6F7F5] text-xl text-[#3F4E3F]">
          {icon}
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#1F2420]">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#5C605A]">{text}</p>
      </div>
      {visual}
    </article>
  );
}

function FeatureSmallCard({
  title,
  text,
  children,
  tinted,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border border-[#E5E7E4] p-6 shadow-[0_12px_40px_rgba(31,36,32,0.035)] lg:col-span-3 ${
        tinted ? "bg-[#E8EBE7]" : "bg-white"
      }`}
    >
      <div className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-[#F6F7F5] text-[#3F4E3F]">
        ✦
      </div>
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#1F2420]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[#5C605A]">{text}</p>
      {children}
    </article>
  );
}

function AudioWave() {
  return (
    <div className="flex h-16 items-center gap-1 text-[#6B7E68]" aria-hidden="true">
      {[22, 36, 50, 64, 44, 58, 42, 30].map((height, index) => (
        <span
          key={index}
          className="w-1 rounded-full bg-current"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function MapTarget() {
  return (
    <div className="grid h-24 w-24 place-items-center rounded-2xl border border-[#E5E7E4] bg-[#F6F7F5]" aria-hidden="true">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
        <span className="h-5 w-5 rounded-full border-8 border-[#3F4E3F]" />
      </span>
    </div>
  );
}

function LiveDemoSection() {
  return (
    <AnimatedSection className="bg-[#F6F7F5] px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Demo ao vivo</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
            Veja o convite a respirar.
          </h2>
          <p className="mt-5 text-[#5C605A]">
            A experiência final parece leve para os convidados, mas concentra
            tudo o que o evento precisa.
          </p>
        </div>
        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <PhoneIframePreview title="Leonor & Diogo" src="/leonor-diogo" />
          <PhoneIframePreview title="Sofia & Pedro" src="/sofia-pedro" />
        </div>
      </div>
    </AnimatedSection>
  );
}

function PhoneIframePreview({ title, src }: { title: string; src: string }) {
  function hideScrollbar(event: React.SyntheticEvent<HTMLIFrameElement>) {
    const iframeDocument = event.currentTarget.contentDocument;

    if (!iframeDocument) return;

    iframeDocument.documentElement.style.scrollbarWidth = "none";
    iframeDocument.body.style.scrollbarWidth = "none";
    iframeDocument.body.style.msOverflowStyle = "none";

    if (!iframeDocument.getElementById("brindeal-hide-scrollbar")) {
      const style = iframeDocument.createElement("style");
      style.id = "brindeal-hide-scrollbar";
      style.textContent = "::-webkit-scrollbar{display:none}";
      iframeDocument.head.appendChild(style);
    }
  }

  return (
    <article className="text-center">
      <div className="mx-auto aspect-[9/16] w-full max-w-[20rem] overflow-hidden rounded-[2.75rem] border-[7px] border-[#3F4E3F] bg-white shadow-[0_28px_90px_rgba(31,36,32,0.16)]">
        <iframe
          title={`Pré-visualização do convite ${title}`}
          src={src}
          className="h-full w-full border-0 [scrollbar-width:none]"
          loading="lazy"
          onLoad={hideScrollbar}
        />
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-[#1F2420]">
        {title}
      </h3>
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex rounded-full border border-[#E5E7E4] bg-white px-6 py-3 text-sm font-semibold text-[#1F2420] transition hover:border-[#3F4E3F] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
      >
        Abrir convite →
      </a>
    </article>
  );
}

function FaqSection({
  openIndex,
  setOpenIndex,
}: {
  openIndex: number;
  setOpenIndex: (index: number) => void;
}) {
  return (
    <AnimatedSection id="faq" className="bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em]">
            Perguntas frequentes
          </h2>
          <p className="mt-5 text-[#5C605A]">
            Tudo o que precisa de saber antes de começarmos. Não encontra a
            resposta? Falamos no WhatsApp.
          </p>
          <div className="mt-8 rounded-2xl bg-[#F6F7F5] p-6 text-sm text-[#3F4E3F]">
            <p className="font-semibold text-[#1F2420]">Falar agora</p>
            <p className="mt-2">WhatsApp · {DISPLAY_WHATSAPP_NUMBER}</p>
            <p>E-mail · ola@brindeal.studio</p>
          </div>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="rounded-2xl border border-[#E5E7E4] bg-white p-5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
                >
                  {faq.question}
                  <span className="text-2xl text-[#5C605A]">{isOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.p
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-4 text-sm leading-6 text-[#5C605A]"
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

function ContactSection({
  formState,
  onFieldChange,
  onSubmit,
}: {
  formState: ContactMessageFields;
  onFieldChange: (field: keyof ContactMessageFields, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <AnimatedSection id="orcamento" className="bg-[#F6F7F5] px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
        <div>
          <SectionEyebrow>Vamos criar juntos</SectionEyebrow>
          <h2 className="mt-6 text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-[#1F2420] sm:text-5xl">
            O vosso convite
            <span className="block text-[#3F4E3F]">
              começa hoje.
            </span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C605A]">
            Conte-nos a data e o estilo. Enviamos uma proposta clara no mesmo
            dia, sem compromisso.
          </p>
          <div className="mt-8 space-y-3 text-sm text-[#3F4E3F]">
            <p>WhatsApp · {DISPLAY_WHATSAPP_NUMBER}</p>
            <p>E-mail · ola@brindeal.studio</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="rounded-[1.5rem] border border-[#E5E7E4] bg-white p-6 shadow-sm sm:p-9">
          <h3 className="text-2xl font-semibold">Pedir orçamento</h3>
          <p className="mt-2 text-sm text-[#5C605A]">Resposta no mesmo dia.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <TextField label="Nome" placeholder="Maria Silva" value={formState.name} onChange={(value) => onFieldChange("name", value)} />
            <TextField label="Tipo de evento" placeholder="Casamento" value={formState.eventType} onChange={(value) => onFieldChange("eventType", value)} />
            <TextField label="Data" placeholder="12 Setembro 2026" value={formState.date} onChange={(value) => onFieldChange("date", value)} />
            <TextField label="Convidados" placeholder="120" value={formState.guests} onChange={(value) => onFieldChange("guests", value)} />
          </div>
          <label className="mt-4 block text-sm font-semibold text-[#1F2420]">
            Mensagem
            <textarea
              value={formState.message}
              onChange={(event) => onFieldChange("message", event.target.value)}
              className="mt-2 min-h-28 w-full rounded-2xl border border-[#E5E7E4] bg-[#F6F7F5] px-4 py-3 text-sm font-normal outline-none transition focus:border-[#3F4E3F] focus:ring-2 focus:ring-[#3F4E3F]/20"
              placeholder="Conte-nos o estilo, local ou qualquer detalhe importante."
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-[#3F4E3F] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            Enviar pedido pelo WhatsApp
          </button>
        </form>
      </div>
    </AnimatedSection>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[#1F2420]">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7E4] bg-[#F6F7F5] px-4 text-sm font-normal outline-none transition focus:border-[#3F4E3F] focus:ring-2 focus:ring-[#3F4E3F]/20"
      />
    </label>
  );
}

function Footer() {
  return (
    <footer className="bg-[#1F2420] px-5 py-16 text-[#E8EBE7] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-xl font-semibold text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E8EBE7]" />
            brindeal
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-[#A3A496]">
            Convites digitais feitos com cuidado, em Lisboa.
          </p>
        </div>
        {[
          ["Produto", "Casamento", "Save the Date", "Baptizado", "Noivado"],
          ["Recursos", "Galeria", "Como funciona", "FAQ", "Blog"],
          ["Empresa", "Sobre", "Contacto", "Termos", "Privacidade"],
        ].map(([heading, ...links]) => (
          <div key={heading} className="space-y-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white">
              {heading}
            </p>
            {links.map((link) => (
              <a key={link} href="#top" className="block text-[#A3A496] transition hover:text-white">
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#A3A496] sm:flex-row">
        <p>© 2026 Brindeal Studio · Feito com cuidado em Lisboa</p>
        <p>Português · English · Español</p>
      </div>
    </footer>
  );
}
