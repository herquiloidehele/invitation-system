import type { Metadata } from "next";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  resolveLocale,
  type AppLocale,
} from "@/i18n/locales";
import {
  SITE_URL,
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildLocalePath,
  createIndexableRobotsMetadata,
} from "@/lib/seo";

export const SERVICE_PAGE_SLUGS = [
  "convites-digitais",
  "save-the-date-digital",
] as const;

export type ServicePageSlug = (typeof SERVICE_PAGE_SLUGS)[number];

export type ServicePageContent = {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  proof: string;
  sections: Array<{ title: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  ctaTitle: string;
  ctaBody: string;
};

const CONTENT: Record<ServicePageSlug, Record<AppLocale, ServicePageContent>> = {
  "convites-digitais": {
    pt: {
      title: "Convites Digitais Personalizados | Brindeal Studio",
      description:
        "Convites digitais personalizados para casamentos, batizados, aniversários e noivados, com design à medida, RSVP online e partilha simples por WhatsApp.",
      eyebrow: "Convites digitais",
      h1: "Convites digitais desenhados para a história de cada celebração",
      intro:
        "A Brindeal Studio cria convites digitais elegantes, rápidos de partilhar e fáceis de usar. Cada página reúne texto, fotografias, mapa, música, horários e confirmações num link bonito que os convidados abrem no telemóvel.",
      proof: "Ideal para casamentos, save the date, batizados, aniversários e noivados.",
      sections: [
        {
          title: "Uma experiência completa num só link",
          body: "O convite deixa de ser apenas uma imagem enviada por mensagem. Criamos uma página pensada para guiar os convidados: primeiro impacto visual, detalhes essenciais, localizações, perguntas frequentes e chamada para confirmação quando necessário.",
        },
        {
          title: "Design personalizado e publicação acompanhada",
          body: "Começamos com uma conversa sobre o evento, o tom e as referências visuais. Depois tratamos do design, adaptação mobile, publicação e ajustes para que o convite esteja pronto a enviar sem trabalho técnico da vossa parte.",
        },
      ],
      faqs: [
        {
          question: "O convite digital funciona em qualquer telemóvel?",
          answer: "Sim. As páginas são desenhadas para mobile primeiro e também funcionam em desktop.",
        },
        {
          question: "Podemos incluir mapa, música e RSVP?",
          answer: "Sim. Esses módulos podem ser combinados conforme o tipo de evento.",
        },
      ],
      ctaTitle: "Querem criar um convite digital?",
      ctaBody: "Enviem-nos a data, o tipo de evento e o estilo que imaginam. Respondemos com uma proposta clara.",
    },
    en: {
      title: "Personalized Digital Invitations | Brindeal Studio",
      description:
        "Personalized digital invitations for weddings, baptisms, birthdays and engagements, with tailored design, online RSVP and simple WhatsApp sharing.",
      eyebrow: "Digital invitations",
      h1: "Digital invitations designed around each celebration",
      intro:
        "Brindeal Studio creates elegant digital invitations that are easy to share and simple for guests to use. Each page gathers copy, photos, maps, music, schedules and confirmations in one mobile-friendly link.",
      proof: "Made for weddings, save the dates, baptisms, birthdays and engagements.",
      sections: [
        {
          title: "A complete experience in one link",
          body: "Your invitation becomes more than an image in a message. We build a guided page with visual impact, practical details, locations, FAQs and RSVP flows when needed.",
        },
        {
          title: "Tailored design and guided publishing",
          body: "We start with your event, tone and visual references, then handle design, mobile adaptation, publishing and refinements so the invitation is ready to send without technical work from you.",
        },
      ],
      faqs: [
        {
          question: "Does the digital invitation work on any phone?",
          answer: "Yes. Pages are designed mobile-first and also work on desktop.",
        },
        {
          question: "Can we include maps, music and RSVP?",
          answer: "Yes. Those modules can be combined depending on the event.",
        },
      ],
      ctaTitle: "Want to create a digital invitation?",
      ctaBody: "Send us the date, event type and style you have in mind. We will reply with a clear proposal.",
    },
    es: {
      title: "Invitaciones Digitales Personalizadas | Brindeal Studio",
      description:
        "Invitaciones digitales personalizadas para bodas, bautizos, cumpleaños y compromisos, con diseño a medida, RSVP online y envío fácil por WhatsApp.",
      eyebrow: "Invitaciones digitales",
      h1: "Invitaciones digitales diseñadas para cada celebración",
      intro:
        "Brindeal Studio crea invitaciones digitales elegantes, fáciles de compartir y simples para los invitados. Cada página reúne texto, fotos, mapa, música, horarios y confirmaciones en un enlace móvil.",
      proof: "Para bodas, save the date, bautizos, cumpleaños y compromisos.",
      sections: [
        {
          title: "Una experiencia completa en un enlace",
          body: "La invitación deja de ser solo una imagen enviada por mensaje. Creamos una página guiada con impacto visual, detalles prácticos, ubicaciones, preguntas frecuentes y RSVP cuando hace falta.",
        },
        {
          title: "Diseño a medida y publicación acompañada",
          body: "Empezamos con vuestro evento, tono y referencias visuales. Después nos ocupamos del diseño, adaptación móvil, publicación y ajustes para que esté lista sin trabajo técnico para vosotros.",
        },
      ],
      faqs: [
        {
          question: "La invitación digital funciona en cualquier móvil?",
          answer: "Sí. Las páginas se diseñan primero para móvil y también funcionan en desktop.",
        },
        {
          question: "Podemos incluir mapa, música y RSVP?",
          answer: "Sí. Esos módulos se pueden combinar según el evento.",
        },
      ],
      ctaTitle: "Queréis crear una invitación digital?",
      ctaBody: "Enviadnos la fecha, tipo de evento y estilo que imagináis. Responderemos con una propuesta clara.",
    },
  },
  "save-the-date-digital": {
    pt: {
      title: "Save the Date Digital | Brindeal Studio",
      description:
        "Save the date digital personalizado para anunciar a data do casamento com contagem, animação, música, RSVP opcional e partilha simples por WhatsApp.",
      eyebrow: "Save the date",
      h1: "Save the Date digital para anunciar a data com leveza",
      intro:
        "O Save the Date digital é a primeira pista do vosso casamento. Criamos uma página breve, elegante e memorável para anunciar a data, criar expectativa e ajudar os convidados a reservarem o dia.",
      proof: "Pode incluir contagem, animação, música, fotografia e RSVP inicial.",
      sections: [
        {
          title: "Um primeiro momento antes do convite completo",
          body: "É ideal quando ainda não têm todos os detalhes fechados, mas já querem avisar família e amigos. Mais tarde, o convite completo pode seguir a mesma linguagem visual.",
        },
        {
          title: "Fácil de partilhar e guardar",
          body: "O link pode ser enviado por WhatsApp, email ou mensagem. Os convidados abrem a página no telemóvel e guardam a data sem depender de ficheiros pesados.",
        },
      ],
      faqs: [
        {
          question: "O Save the Date pode ter RSVP?",
          answer: "Sim. Pode incluir uma confirmação inicial ou apenas anunciar a data.",
        },
        {
          question: "Podemos criar depois o convite completo?",
          answer: "Sim. Podemos manter a mesma identidade visual no convite final.",
        },
      ],
      ctaTitle: "Vamos anunciar a data?",
      ctaBody: "Enviem-nos a data e o estilo. Criamos um Save the Date digital pronto a partilhar.",
    },
    en: {
      title: "Digital Save the Date | Brindeal Studio",
      description:
        "Personalized digital save the date pages for weddings, with countdown, animation, music, optional RSVP and simple WhatsApp sharing.",
      eyebrow: "Save the date",
      h1: "A digital Save the Date to announce the day beautifully",
      intro:
        "A digital Save the Date is the first glimpse of your wedding. We create a short, elegant and memorable page to announce the date, build anticipation and help guests reserve the day.",
      proof: "Can include countdown, animation, music, photography and initial RSVP.",
      sections: [
        {
          title: "A first moment before the full invitation",
          body: "It is ideal when not every detail is final yet, but you already want to tell family and friends. Later, the full invitation can follow the same visual identity.",
        },
        {
          title: "Easy to share and keep",
          body: "The link can be sent by WhatsApp, email or message. Guests open it on mobile and save the date without heavy files.",
        },
      ],
      faqs: [
        {
          question: "Can the Save the Date include RSVP?",
          answer: "Yes. It can include an initial confirmation or simply announce the date.",
        },
        {
          question: "Can we create the full invitation later?",
          answer: "Yes. We can keep the same visual identity for the final invitation.",
        },
      ],
      ctaTitle: "Shall we announce the date?",
      ctaBody: "Send us the date and style. We will create a digital Save the Date ready to share.",
    },
    es: {
      title: "Save the Date Digital | Brindeal Studio",
      description:
        "Save the date digital personalizado para bodas, con cuenta atrás, animación, música, RSVP opcional y envío fácil por WhatsApp.",
      eyebrow: "Save the date",
      h1: "Un Save the Date digital para anunciar la fecha con estilo",
      intro:
        "El Save the Date digital es la primera pista de vuestra boda. Creamos una página breve, elegante y memorable para anunciar la fecha y ayudar a los invitados a reservar el día.",
      proof: "Puede incluir cuenta atrás, animación, música, fotografía y RSVP inicial.",
      sections: [
        {
          title: "Un primer momento antes de la invitación completa",
          body: "Es ideal cuando aún no están cerrados todos los detalles, pero ya queréis avisar a familia y amigos. Después, la invitación completa puede seguir la misma identidad visual.",
        },
        {
          title: "Fácil de compartir y guardar",
          body: "El enlace se puede enviar por WhatsApp, email o mensaje. Los invitados lo abren en el móvil y guardan la fecha sin archivos pesados.",
        },
      ],
      faqs: [
        {
          question: "El Save the Date puede tener RSVP?",
          answer: "Sí. Puede incluir una confirmación inicial o solo anunciar la fecha.",
        },
        {
          question: "Podemos crear después la invitación completa?",
          answer: "Sí. Podemos mantener la misma identidad visual en la invitación final.",
        },
      ],
      ctaTitle: "Anunciamos la fecha?",
      ctaBody: "Enviadnos la fecha y el estilo. Crearemos un Save the Date digital listo para compartir.",
    },
  },
};

export function getServicePageContent(
  slug: ServicePageSlug,
  locale: unknown,
): ServicePageContent {
  return CONTENT[slug][resolveLocale(locale)];
}

export function getServicePageSitemapPaths(): string[] {
  return SERVICE_PAGE_SLUGS.flatMap((slug) =>
    SUPPORTED_LOCALES.map((locale) => buildLocalePath(`/${slug}`, locale)),
  );
}

export function buildServicePageMetadata(
  slug: ServicePageSlug,
  rawLocale: unknown,
): Metadata {
  const locale = resolveLocale(rawLocale);
  const content = getServicePageContent(slug, locale);
  const path = buildLocalePath(`/${slug}`, locale);
  const url = buildAbsoluteUrl(SITE_URL, path);

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(SITE_URL, `/${slug}`),
    },
    robots: createIndexableRobotsMetadata(),
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      locale,
      type: "website",
    },
  };
}

export function getDefaultServicePageHref(slug: ServicePageSlug): string {
  return buildLocalePath(`/${slug}`, DEFAULT_LOCALE);
}
