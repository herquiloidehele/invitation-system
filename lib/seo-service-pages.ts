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
  "convites-casamento",
  "save-the-date-digital",
  "convites-com-rsvp",
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
  "convites-casamento": {
    pt: {
      title: "Convites de Casamento Digitais | Brindeal Studio",
      description:
        "Convites de casamento digitais personalizados em Portugal, com RSVP online, mapa, música, programa do dia, galeria e acompanhamento até à publicação.",
      eyebrow: "Casamentos",
      h1: "Convites de casamento digitais elegantes, pessoais e prontos a partilhar",
      intro:
        "Criamos convites de casamento digitais para casais que querem uma experiência bonita e prática. O convite reúne a história, os horários, as localizações, o RSVP e os detalhes importantes num link simples para enviar aos convidados.",
      proof: "Design à medida, resposta no mesmo dia e publicação acompanhada.",
      sections: [
        {
          title: "Pensado para convidados reais",
          body: "Os convidados encontram rapidamente a data, morada, mapa, opções de navegação, programa e perguntas frequentes. Se ativarem RSVP, as confirmações ficam organizadas num painel privado.",
        },
        {
          title: "Um convite com o vosso tom",
          body: "Podemos criar uma estética editorial, romântica, minimalista, floral, clássica ou mais cinematográfica. O objetivo é que o convite pareça vosso, não apenas um modelo preenchido.",
        },
      ],
      faqs: [
        {
          question: "Quanto tempo demora um convite de casamento digital?",
          answer: "Normalmente entre 4 e 10 dias úteis, dependendo dos materiais e revisões.",
        },
        {
          question: "Podemos acompanhar as confirmações?",
          answer: "Sim. O RSVP online permite ver respostas, mensagens e informação dos convidados.",
        },
      ],
      ctaTitle: "Vamos desenhar o vosso convite de casamento?",
      ctaBody: "Partilhem a data, local e referências. Preparamos uma proposta para o vosso convite digital.",
    },
    en: {
      title: "Digital Wedding Invitations | Brindeal Studio",
      description:
        "Personalized digital wedding invitations in Portugal, with online RSVP, maps, music, schedule, gallery and guided publishing.",
      eyebrow: "Weddings",
      h1: "Elegant digital wedding invitations ready to share",
      intro:
        "We create digital wedding invitations for couples who want a beautiful and practical guest experience. The invitation gathers your story, schedule, locations, RSVP and key details in one simple link.",
      proof: "Tailored design, same-day reply and guided publishing.",
      sections: [
        {
          title: "Made for real guests",
          body: "Guests quickly find the date, address, map, navigation options, schedule and FAQs. If RSVP is enabled, confirmations are organized in a private dashboard.",
        },
        {
          title: "An invitation with your tone",
          body: "We can create an editorial, romantic, minimal, floral, classic or cinematic direction. The goal is a page that feels personal, not like a filled template.",
        },
      ],
      faqs: [
        {
          question: "How long does a digital wedding invitation take?",
          answer: "Usually 4 to 10 business days, depending on materials and revisions.",
        },
        {
          question: "Can we track confirmations?",
          answer: "Yes. Online RSVP lets you view responses, messages and guest information.",
        },
      ],
      ctaTitle: "Shall we design your wedding invitation?",
      ctaBody: "Share your date, venue and references. We will prepare a proposal for your digital invitation.",
    },
    es: {
      title: "Invitaciones de Boda Digitales | Brindeal Studio",
      description:
        "Invitaciones de boda digitales personalizadas en Portugal, con RSVP online, mapa, música, programa, galería y publicación acompañada.",
      eyebrow: "Bodas",
      h1: "Invitaciones de boda digitales elegantes y listas para enviar",
      intro:
        "Creamos invitaciones de boda digitales para parejas que quieren una experiencia bonita y práctica. La invitación reúne historia, horarios, ubicaciones, RSVP y detalles clave en un enlace simple.",
      proof: "Diseño a medida, respuesta el mismo día y publicación acompañada.",
      sections: [
        {
          title: "Pensada para invitados reales",
          body: "Los invitados encuentran fecha, dirección, mapa, navegación, programa y preguntas frecuentes. Con RSVP, las confirmaciones quedan organizadas en un panel privado.",
        },
        {
          title: "Una invitación con vuestro tono",
          body: "Podemos crear una estética editorial, romántica, minimalista, floral, clásica o cinematográfica. El objetivo es que se sienta personal, no como una plantilla rellenada.",
        },
      ],
      faqs: [
        {
          question: "Cuánto tarda una invitación de boda digital?",
          answer: "Normalmente entre 4 y 10 días laborables, según materiales y revisiones.",
        },
        {
          question: "Podemos seguir las confirmaciones?",
          answer: "Sí. El RSVP online permite ver respuestas, mensajes e información de invitados.",
        },
      ],
      ctaTitle: "Diseñamos vuestra invitación de boda?",
      ctaBody: "Compartid fecha, lugar y referencias. Prepararemos una propuesta para vuestra invitación digital.",
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
  "convites-com-rsvp": {
    pt: {
      title: "Convites com RSVP Online | Brindeal Studio",
      description:
        "Convites digitais com RSVP online para casamentos e eventos, com confirmações em tempo real, mensagens dos convidados e painel privado.",
      eyebrow: "RSVP online",
      h1: "Convites com RSVP online para organizar respostas sem folhas soltas",
      intro:
        "Um convite com RSVP online ajuda a transformar respostas dispersas em informação organizada. Os convidados confirmam no link, deixam mensagem e indicam detalhes úteis quando necessário.",
      proof: "Confirmações centralizadas, painel privado e experiência simples para convidados.",
      sections: [
        {
          title: "Menos conversas perdidas",
          body: "Em vez de recolher respostas por várias mensagens, recebem confirmações estruturadas. Isto facilita contagens, listas finais, restrições alimentares e acompanhamento dos convidados.",
        },
        {
          title: "RSVP integrado no design do convite",
          body: "O formulário não parece um anexo técnico. Faz parte da experiência visual do convite e mantém o tom do evento até ao momento da confirmação.",
        },
      ],
      faqs: [
        {
          question: "O RSVP pode pedir restrições alimentares?",
          answer: "Sim. Também pode pedir email, mensagem ou outros detalhes definidos no convite.",
        },
        {
          question: "Os noivos têm acesso às respostas?",
          answer: "Sim. As respostas ficam disponíveis num painel privado.",
        },
      ],
      ctaTitle: "Querem simplificar as confirmações?",
      ctaBody: "Criamos um convite digital com RSVP alinhado com o vosso evento.",
    },
    en: {
      title: "Invitations with Online RSVP | Brindeal Studio",
      description:
        "Digital invitations with online RSVP for weddings and events, with real-time confirmations, guest messages and a private dashboard.",
      eyebrow: "Online RSVP",
      h1: "Invitations with online RSVP to organize replies clearly",
      intro:
        "An invitation with online RSVP turns scattered replies into organized information. Guests confirm through the link, leave messages and share useful details when needed.",
      proof: "Centralized confirmations, private dashboard and a simple guest experience.",
      sections: [
        {
          title: "Fewer lost conversations",
          body: "Instead of collecting replies across many messages, you receive structured confirmations. This makes headcounts, final lists and dietary restrictions easier to manage.",
        },
        {
          title: "RSVP integrated into the invitation design",
          body: "The form does not feel like a technical add-on. It belongs to the visual experience and keeps the event tone through confirmation.",
        },
      ],
      faqs: [
        {
          question: "Can RSVP ask for dietary restrictions?",
          answer: "Yes. It can also ask for email, message or other details configured for the invitation.",
        },
        {
          question: "Do hosts access the replies?",
          answer: "Yes. Replies are available in a private dashboard.",
        },
      ],
      ctaTitle: "Want to simplify confirmations?",
      ctaBody: "We create a digital invitation with RSVP aligned with your event.",
    },
    es: {
      title: "Invitaciones con RSVP Online | Brindeal Studio",
      description:
        "Invitaciones digitales con RSVP online para bodas y eventos, con confirmaciones en tiempo real, mensajes de invitados y panel privado.",
      eyebrow: "RSVP online",
      h1: "Invitaciones con RSVP online para organizar respuestas sin caos",
      intro:
        "Una invitación con RSVP online convierte respuestas dispersas en información organizada. Los invitados confirman en el enlace, dejan mensaje e indican detalles útiles si hace falta.",
      proof: "Confirmaciones centralizadas, panel privado y experiencia simple para invitados.",
      sections: [
        {
          title: "Menos conversaciones perdidas",
          body: "En lugar de recoger respuestas en muchos mensajes, recibís confirmaciones estructuradas. Esto facilita recuentos, listas finales y restricciones alimentarias.",
        },
        {
          title: "RSVP integrado en el diseño",
          body: "El formulario no parece un añadido técnico. Forma parte de la experiencia visual y mantiene el tono del evento hasta la confirmación.",
        },
      ],
      faqs: [
        {
          question: "El RSVP puede pedir restricciones alimentarias?",
          answer: "Sí. También puede pedir email, mensaje u otros detalles configurados.",
        },
        {
          question: "Los anfitriones acceden a las respuestas?",
          answer: "Sí. Las respuestas están disponibles en un panel privado.",
        },
      ],
      ctaTitle: "Queréis simplificar las confirmaciones?",
      ctaBody: "Creamos una invitación digital con RSVP alineado con vuestro evento.",
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
