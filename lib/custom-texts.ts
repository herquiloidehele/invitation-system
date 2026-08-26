import { useTranslations } from "next-intl";

import type { CustomTexts } from "./types";

// ---------------------------------------------------------------------------
// Locale-aware resolvers.
//
// The Invitation chrome strings live in `messages/{pt,en,es}.json` under
// the `Invitation` namespace. A per-invitation `customTexts` JSON column
// can override any key. Resolution order:
//   1. customTexts[key]  (per-invitation override; truthy)
//   2. messages[locale].Invitation[key]  (locale default)
//   3. key  (next-intl loud-fail; surfaces missing keys in dev)
// ---------------------------------------------------------------------------

type IntlT = (key: string, values?: Record<string, string>) => string;

/**
 * Applies `{placeholder}` substitution to a per-invitation override.
 *
 * next-intl performs this for message defaults, but an override short-circuits
 * next-intl entirely — without this, overriding an interpolated key such as
 * `calendar_weddingTitle` would render the literal `{names}`. Unknown
 * placeholders are left in place so a typo is visible rather than silently
 * blanked.
 */
export function applyCustomTextValues(
  text: string,
  values?: Record<string, string>,
): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
}

/** Client hook — returns a resolver bound to the current request locale. */
export function useCustomText(
  customTexts: CustomTexts | undefined | null,
): (key: keyof CustomTexts, values?: Record<string, string>) => string {
  const tn = useTranslations("Invitation");
  return (key, values) => {
    const override = customTexts?.[key];
    if (override) return applyCustomTextValues(override, values);
    return tn(key, values);
  };
}

/**
 * Server-side equivalent. Caller resolves the `t` function once via
 * `getTranslations("Invitation")` and passes it in.
 */
export function getCustomText(
  customTexts: CustomTexts | undefined | null,
  key: keyof CustomTexts,
  tn: IntlT,
  values?: Record<string, string>,
): string {
  const override = customTexts?.[key];
  if (override) return applyCustomTextValues(override, values);
  return tn(key, values);
}

// ---------------------------------------------------------------------------
// Metadata — human-readable labels & grouping for the admin form.
// The admin form is Portuguese-only; placeholders carry the PT default
// text the system would render if the field is left empty.
// ---------------------------------------------------------------------------

export interface CustomTextFieldMeta {
  key: keyof CustomTexts;
  label: string;
  placeholder: string;
}

export interface CustomTextGroup {
  id: string;
  label: string;
  fields: CustomTextFieldMeta[];
}

/** Ordered groups of customisable text fields for the admin form. */
export const CUSTOM_TEXT_GROUPS: CustomTextGroup[] = [
  {
    id: "sectionTitles",
    label: "Títulos de Secção",
    fields: [
      {
        key: "sectionTitle_ourStory",
        label: "Nossa História",
        placeholder: "Nossa História",
      },
      {
        key: "sectionTitle_schedule",
        label: "Programação",
        placeholder: "Programação",
      },
      {
        key: "sectionTitle_location",
        label: "Localização",
        placeholder: "Localização",
      },
      {
        key: "sectionTitle_dressCode",
        label: "Dress Code",
        placeholder: "Dress Code",
      },
      {
        key: "sectionTitle_giftRegistry",
        label: "Presentes",
        placeholder: "Presentes",
      },
      {
        key: "sectionTitle_guestGuide",
        label: "Manual do Bom Convidado",
        placeholder: "Manual do Bom Convidado",
      },
      {
        key: "sectionTitle_faqs",
        label: "Perguntas Frequentes",
        placeholder: "Perguntas Frequentes",
      },
      {
        key: "sectionTitle_gallery",
        label: "Galeria de Fotos",
        placeholder: "Nossos Momentos",
      },
      { key: "sectionTitle_rsvp", label: "RSVP", placeholder: "RSVP" },
    ],
  },
  {
    id: "hero",
    label: "Cabeçalho / Hero",
    fields: [
      {
        key: "hero_inviteLabel",
        label: "Frase de convite",
        placeholder: "Convidam para o seu casamento",
      },
    ],
  },
  {
    id: "cta",
    label: "Botões e Ações",
    fields: [
      {
        key: "cta_confirmLabel",
        label: "Label de confirmação",
        placeholder: "RSVP",
      },
      {
        key: "cta_confirmButton",
        label: "Botão confirmar",
        placeholder: "Confirmar Presença",
      },
      {
        key: "cta_confirmedButton",
        label: "Botão já confirmado",
        placeholder: "Presença Confirmada",
      },
      {
        key: "cta_giftLink",
        label: "Link presentes",
        placeholder: "Ver lista",
      },
      {
        key: "cta_openMap",
        label: "Abrir mapa",
        placeholder: "Abrir no Mapa",
      },
      {
        key: "cta_addToCalendar",
        label: "Adicionar ao calendário",
        placeholder: "+ Adicionar ao Calendário",
      },
    ],
  },
  {
    id: "saveDate",
    label: "Save the Date",
    fields: [
      {
        key: "saveDate_label",
        label: "Título Save the Date",
        placeholder: "Save the Date",
      },
      {
        key: "saveDate_celebrationTitle",
        label: "Título do grande dia",
        placeholder: "Hoje é o grande dia!",
      },
      {
        key: "saveDate_days",
        label: "Dias",
        placeholder: "Dias",
      },
      {
        key: "saveDate_hours",
        label: "Horas",
        placeholder: "Horas",
      },
      {
        key: "saveDate_minutes",
        label: "Minutos",
        placeholder: "Minutos",
      },
      {
        key: "saveDate_seconds",
        label: "Segundos",
        placeholder: "Segundos",
      },
      {
        key: "saveDate_dayLabel",
        label: "Label dia",
        placeholder: "Dia",
      },
      {
        key: "saveDate_monthLabel",
        label: "Label mês",
        placeholder: "Mês",
      },
      {
        key: "saveDate_yearLabel",
        label: "Label ano",
        placeholder: "Ano",
      },
      {
        key: "saveDate_dayOfWeekLabel",
        label: "Label dia da semana",
        placeholder: "Dia da Semana",
      },
    ],
  },
  {
    id: "rsvpForm",
    label: "Formulário RSVP",
    fields: [
      {
        key: "rsvp_modalTitle",
        label: "Título do modal",
        placeholder: "Confirmar Presença",
      },
      {
        key: "rsvp_nameLabel",
        label: "Label nome",
        placeholder: "Nome(s) *",
      },
      {
        key: "rsvp_namePlaceholder",
        label: "Placeholder nome",
        placeholder: "Nome do(s) Convidados(s)",
      },
      {
        key: "rsvp_emailLabel",
        label: "Label email",
        placeholder: "Email",
      },
      {
        key: "rsvp_emailPlaceholder",
        label: "Placeholder email",
        placeholder: "seu@email.com",
      },
      {
        key: "rsvp_attendingLabel",
        label: "Pergunta de comparecimento",
        placeholder: "Irá comparecer? *",
      },
      {
        key: "rsvp_attendingYes",
        label: "Opção sim",
        placeholder: "Sim, estarei lá!",
      },
      {
        key: "rsvp_attendingNo",
        label: "Opção não",
        placeholder: "Não poderei ir",
      },
      {
        key: "rsvp_dietaryLabel",
        label: "Label restrições",
        placeholder: "Restrições alimentares",
      },
      {
        key: "rsvp_dietaryPlaceholder",
        label: "Placeholder restrições",
        placeholder: "Vegetariano, sem glúten…",
      },
      {
        key: "rsvp_companionLabel",
        label: "Label acompanhante",
        placeholder: "Acompanhante",
      },
      {
        key: "rsvp_companionPlaceholder",
        label: "Placeholder acompanhante",
        placeholder: "Nome do acompanhante",
      },
      {
        key: "rsvp_adultsLabel",
        label: "Label adultos",
        placeholder: "Adultos",
      },
      {
        key: "rsvp_childrenLabel",
        label: "Label crianças",
        placeholder: "Crianças",
      },
      {
        key: "rsvp_messageLabel",
        label: "Label mensagem",
        placeholder: "Mensagem",
      },
      {
        key: "rsvp_messagePlaceholder",
        label: "Placeholder mensagem",
        placeholder: "Deixe uma mensagem especial…",
      },
    ],
  },
  {
    id: "rsvpStates",
    label: "RSVP — Estados e Ações",
    fields: [
      {
        key: "rsvp_submitButton",
        label: "Botão enviar",
        placeholder: "Confirmar",
      },
      {
        key: "rsvp_submitting",
        label: "Texto enviando",
        placeholder: "Enviando…",
      },
      {
        key: "rsvp_successTitle",
        label: "Título sucesso",
        placeholder: "Obrigado!",
      },
      {
        key: "rsvp_successMessage",
        label: "Mensagem sucesso",
        placeholder: "Sua confirmação foi registrada com sucesso.",
      },
      {
        key: "rsvp_alreadyTitle",
        label: "Título já confirmado",
        placeholder: "Presença já confirmada!",
      },
      {
        key: "rsvp_entryPassTitle",
        label: "Título passe (sucesso RSVP)",
        placeholder: "Apresenta este código à entrada",
      },
      {
        key: "rsvp_alreadyMessage",
        label: "Mensagem já confirmado",
        placeholder: "Você já enviou sua confirmação para este evento.",
      },
      {
        key: "rsvp_errorTitle",
        label: "Título erro",
        placeholder: "Erro ao enviar",
      },
      {
        key: "rsvp_errorMessage",
        label: "Mensagem erro",
        placeholder: "Tente novamente em alguns instantes.",
      },
      {
        key: "rsvp_retryButton",
        label: "Botão tentar novamente",
        placeholder: "Tentar novamente",
      },
      {
        key: "rsvp_closeButton",
        label: "Botão fechar",
        placeholder: "Fechar",
      },
    ],
  },
  {
    id: "misc",
    label: "Outros",
    fields: [
      {
        key: "map_unavailableOffline",
        label: "Mapa indisponível",
        placeholder: "Mapa indisponível offline",
      },
    ],
  },
  {
    id: "guestCard",
    label: "Convite Pessoal",
    fields: [
      {
        key: "guestCard_label",
        label: "Etiqueta do convite",
        placeholder: "— Convite Pessoal —",
      },
      {
        key: "guestCard_tableLabel",
        label: "Label da mesa",
        placeholder: "Mesa",
      },
      {
        key: "guestCard_noteLabel",
        label: "Label da nota",
        placeholder: "Nota",
      },
      {
        key: "guestCard_inviteButton",
        label: "Botão convidar mais",
        placeholder: "Convidar mais pessoas",
      },
      {
        key: "guestCard_entryPassTitle",
        label: "Título do passe de entrada",
        placeholder: "O teu passe de entrada",
      },
      {
        key: "guestCard_entryPassCaption",
        label: "Legenda do passe (usa {name})",
        placeholder: "{name}",
      },
      {
        key: "entryPass_downloadButton",
        label: "Botão descarregar passe",
        placeholder: "Descarregar",
      },
    ],
  },
  {
    id: "places",
    label: "Locais (Hotéis, Restaurantes…)",
    fields: [
      {
        key: "places_mapLabel",
        label: "Botão de mapa",
        placeholder: "Mapa",
      },
      {
        key: "places_callLabel",
        label: "Botão de telefone",
        placeholder: "Ligar",
      },
    ],
  },
  {
    id: "curtainCanva",
    label: "Curtain & Canva",
    fields: [
      {
        key: "curtain_tapToOpen",
        label: "Convite para abrir",
        placeholder: "Toque para abrir",
      },
      {
        key: "scratch_title",
        label: "Título da raspadinha",
        placeholder: "Data",
      },
      {
        key: "scratch_subtitle",
        label: "Subtítulo da raspadinha",
        placeholder: "Raspe para descobrir",
      },
    ],
  },
  {
    id: "countdownDefaults",
    label: "Contagem Decrescente (padrões)",
    fields: [
      {
        key: "countdown_defaultTitle",
        label: "Título padrão",
        placeholder: "Contagem Decrescente",
      },
      {
        key: "countdown_defaultSubtitle",
        label: "Subtítulo padrão",
        placeholder: "Até ao nosso grande dia",
      },
    ],
  },
  {
    id: "calendar",
    label: "Evento no Calendário",
    fields: [
      {
        key: "calendar_weddingTitle",
        label: "Título (casamento)",
        placeholder: "Casamento {names}",
      },
      {
        key: "calendar_genericTitle",
        label: "Título (outro evento)",
        placeholder: "Evento {name}",
      },
      {
        key: "calendar_weddingDetails",
        label: "Descrição (casamento)",
        placeholder: "Cerimónia de casamento de {bride} e {groom}.",
      },
      {
        key: "calendar_genericDetails",
        label: "Descrição (outro evento)",
        placeholder: "Celebração de {name}.",
      },
    ],
  },
  {
    id: "inviteOthers",
    label: "Convidar Mais Pessoas",
    fields: [
      {
        key: "invite_modalTitle",
        label: "Título da janela",
        placeholder: "Convidar mais pessoas",
      },
      {
        key: "invite_modalSubtitle",
        label: "Subtítulo da janela",
        placeholder:
          "Adiciona o nome dos convidados extra. Receberás um link pessoal para partilhar com cada um.",
      },
      {
        key: "invite_nameLabel",
        label: "Etiqueta do nome",
        placeholder: "Nome *",
      },
      {
        key: "invite_companionLabel",
        label: "Etiqueta do acompanhante",
        placeholder: "Acompanhante",
      },
      {
        key: "invite_submitButton",
        label: "Botão de submissão",
        placeholder: "Adicionar convidado",
      },
      {
        key: "invite_successTitle",
        label: "Título de sucesso",
        placeholder: "Convidado adicionado!",
      },
      {
        key: "invite_shareLinkPrefix",
        label: "Prefixo do link de partilha",
        placeholder: "Partilha este link pessoal com",
      },
      {
        key: "invite_addAnother",
        label: "Adicionar outro",
        placeholder: "Adicionar outro convidado",
      },
      {
        key: "invite_nameRequired",
        label: "Erro: nome obrigatório",
        placeholder: "Nome é obrigatório",
      },
      {
        key: "invite_genericError",
        label: "Erro genérico",
        placeholder: "Falha ao registar convidado",
      },
      {
        key: "invite_unknownError",
        label: "Erro desconhecido",
        placeholder: "Erro desconhecido",
      },
      {
        key: "invite_linkCopied",
        label: "Link copiado",
        placeholder: "Link copiado!",
      },
      {
        key: "invite_copyFailed",
        label: "Falha ao copiar",
        placeholder: "Não foi possível copiar.",
      },
    ],
  },
  {
    id: "rsvpValidation",
    label: "RSVP — Validação e Prazos",
    fields: [
      {
        key: "rsvp_nameRequired",
        label: "Erro: nome obrigatório",
        placeholder: "Nome é obrigatório",
      },
      {
        key: "rsvp_invalidEmail",
        label: "Erro: email inválido",
        placeholder: "Email inválido",
      },
      {
        key: "rsvp_selectOption",
        label: "Erro: opção obrigatória",
        placeholder: "Selecione uma opção",
      },
      {
        key: "rsvp_deadlineClosedTitle",
        label: "Título: prazo encerrado",
        placeholder: "Prazo encerrado",
      },
      {
        key: "rsvp_deadlineClosedMessage",
        label: "Mensagem: prazo encerrado",
        placeholder: "O prazo para confirmação de presença terminou{deadline}.",
      },
      {
        key: "rsvp_deadlineDatePrefix",
        label: "Prefixo da data do prazo",
        placeholder: " em {deadline}",
      },
      {
        key: "rsvp_closedTitle",
        label: "Título: confirmações encerradas",
        placeholder: "Confirmações encerradas",
      },
      {
        key: "rsvp_closedMessage",
        label: "Mensagem: confirmações encerradas",
        placeholder: "As confirmações de presença estão encerradas.",
      },
    ],
  },
  {
    id: "systemMisc",
    label: "Diversos (sistema)",
    fields: [
      {
        key: "envelope_topFlapAlt",
        label: "Texto alternativo da aba do envelope",
        placeholder: "Aba superior do envelope",
      },
      { key: "common_close", label: "Fechar", placeholder: "Fechar" },
    ],
  },
  {
    id: "accessibility",
    label: "Acessibilidade (leitores de ecrã)",
    fields: [
      {
        key: "scratch_revealDayAria",
        label: "Raspadinha — dia",
        placeholder: "Raspe para revelar o dia",
      },
      {
        key: "scratch_revealMonthAria",
        label: "Raspadinha — mês",
        placeholder: "Raspe para revelar o mês",
      },
      {
        key: "scratch_revealYearAria",
        label: "Raspadinha — ano",
        placeholder: "Raspe para revelar o ano",
      },
      {
        key: "nav_scrollToNextAria",
        label: "Botão de rolar para a próxima secção",
        placeholder: "Ir para a próxima secção",
      },
    ],
  },
];
