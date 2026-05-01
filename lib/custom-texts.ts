import type { CustomTexts } from "./types";

// ---------------------------------------------------------------------------
// Default Portuguese texts for every customisable UI string.
// These are the built-in fallbacks used when an invitation does not override
// a given key in its `customTexts` JSON column.
// ---------------------------------------------------------------------------

export const DEFAULT_TEXTS: Required<CustomTexts> = {
  // -- Section Titles --
  sectionTitle_ourStory: "Nossa História",
  sectionTitle_schedule: "Programação",
  sectionTitle_location: "Localização",
  sectionTitle_dressCode: "Dress Code",
  sectionTitle_giftRegistry: "Presentes",
  sectionTitle_guestGuide: "Manual do \n Bom Convidado",
  sectionTitle_faqs: "Perguntas Frequentes",

  // -- CTA / Buttons --
  cta_confirmLabel: "Confirme sua presença",
  cta_confirmButton: "Confirmar Presença",
  cta_confirmedButton: "Presença Confirmada",
  cta_giftLink: "Ver lista",
  cta_openMap: "Abrir no Mapa",
  cta_addToCalendar: "+ Adicionar ao Calendário",

  // -- Save the Date --
  saveDate_label: "Save the Date",
  saveDate_celebrationTitle: "Hoje é o grande dia!",
  saveDate_days: "Dias",
  saveDate_hours: "Horas",
  saveDate_minutes: "Minutos",
  saveDate_seconds: "Segundos",
  saveDate_dayLabel: "Dia",
  saveDate_monthLabel: "Mês",
  saveDate_yearLabel: "Ano",
  saveDate_dayOfWeekLabel: "Dia da Semana",

  // -- Hero --
  hero_inviteLabel: "Convidam para o seu casamento",

  // -- RSVP Modal: Form --
  rsvp_modalTitle: "Confirmar Presença",
  rsvp_nameLabel: "Nome *",
  rsvp_namePlaceholder: "Seu nome completo",
  rsvp_emailLabel: "Email",
  rsvp_emailPlaceholder: "seu@email.com",
  rsvp_attendingLabel: "Você irá comparecer? *",
  rsvp_attendingYes: "Sim, estarei lá!",
  rsvp_attendingNo: "Não poderei ir",
  rsvp_dietaryLabel: "Restrições alimentares",
  rsvp_dietaryPlaceholder: "Vegetariano, sem glúten…",
  rsvp_messageLabel: "Mensagem",
  rsvp_messagePlaceholder: "Deixe uma mensagem especial…",

  // -- RSVP Modal: States & Actions --
  rsvp_deadlinePrefix: "Confirme até",
  rsvp_submitButton: "Confirmar",
  rsvp_submitting: "Enviando…",
  rsvp_successTitle: "Obrigado!",
  rsvp_successMessage: "Sua confirmação foi registrada com sucesso.",
  rsvp_alreadyTitle: "Presença já confirmada!",
  rsvp_alreadyMessage: "Você já enviou sua confirmação para este evento.",
  rsvp_errorTitle: "Erro ao enviar",
  rsvp_errorMessage: "Tente novamente em alguns instantes.",
  rsvp_retryButton: "Tentar novamente",
  rsvp_closeButton: "Fechar",

  // -- Misc --
  map_unavailableOffline: "Mapa indisponível offline",
};

// ---------------------------------------------------------------------------
// Helper — resolve a single text key with fallback to default.
// ---------------------------------------------------------------------------

/**
 * Resolve a customisable text string.
 *
 * @param customTexts  The per-invitation overrides (may be undefined/null).
 * @param key          The key to look up.
 * @returns            The custom value if set, otherwise the built-in default.
 */
export function t(
  customTexts: CustomTexts | undefined | null,
  key: keyof CustomTexts,
): string {
  return customTexts?.[key] || DEFAULT_TEXTS[key];
}

// ---------------------------------------------------------------------------
// Metadata — human-readable labels & grouping for the admin form.
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
        placeholder: DEFAULT_TEXTS.sectionTitle_ourStory,
      },
      {
        key: "sectionTitle_schedule",
        label: "Programação",
        placeholder: DEFAULT_TEXTS.sectionTitle_schedule,
      },
      {
        key: "sectionTitle_location",
        label: "Localização",
        placeholder: DEFAULT_TEXTS.sectionTitle_location,
      },
      {
        key: "sectionTitle_dressCode",
        label: "Dress Code",
        placeholder: DEFAULT_TEXTS.sectionTitle_dressCode,
      },
      {
        key: "sectionTitle_giftRegistry",
        label: "Presentes",
        placeholder: DEFAULT_TEXTS.sectionTitle_giftRegistry,
      },
      {
        key: "sectionTitle_guestGuide",
        label: "Manual do Bom Convidado",
        placeholder: "Manual do Bom Convidado",
      },
      {
        key: "sectionTitle_faqs",
        label: "Perguntas Frequentes",
        placeholder: DEFAULT_TEXTS.sectionTitle_faqs,
      },
    ],
  },
  {
    id: "hero",
    label: "Cabeçalho / Hero",
    fields: [
      {
        key: "hero_inviteLabel",
        label: "Frase de convite",
        placeholder: DEFAULT_TEXTS.hero_inviteLabel,
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
        placeholder: DEFAULT_TEXTS.cta_confirmLabel,
      },
      {
        key: "cta_confirmButton",
        label: "Botão confirmar",
        placeholder: DEFAULT_TEXTS.cta_confirmButton,
      },
      {
        key: "cta_confirmedButton",
        label: "Botão já confirmado",
        placeholder: DEFAULT_TEXTS.cta_confirmedButton,
      },
      {
        key: "cta_giftLink",
        label: "Link presentes",
        placeholder: DEFAULT_TEXTS.cta_giftLink,
      },
      {
        key: "cta_openMap",
        label: "Abrir mapa",
        placeholder: DEFAULT_TEXTS.cta_openMap,
      },
      {
        key: "cta_addToCalendar",
        label: "Adicionar ao calendário",
        placeholder: DEFAULT_TEXTS.cta_addToCalendar,
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
        placeholder: DEFAULT_TEXTS.saveDate_label,
      },
      {
        key: "saveDate_celebrationTitle",
        label: "Título do grande dia",
        placeholder: DEFAULT_TEXTS.saveDate_celebrationTitle,
      },
      {
        key: "saveDate_days",
        label: "Dias",
        placeholder: DEFAULT_TEXTS.saveDate_days,
      },
      {
        key: "saveDate_hours",
        label: "Horas",
        placeholder: DEFAULT_TEXTS.saveDate_hours,
      },
      {
        key: "saveDate_minutes",
        label: "Minutos",
        placeholder: DEFAULT_TEXTS.saveDate_minutes,
      },
      {
        key: "saveDate_seconds",
        label: "Segundos",
        placeholder: DEFAULT_TEXTS.saveDate_seconds,
      },
      {
        key: "saveDate_dayLabel",
        label: "Label dia",
        placeholder: DEFAULT_TEXTS.saveDate_dayLabel,
      },
      {
        key: "saveDate_monthLabel",
        label: "Label mês",
        placeholder: DEFAULT_TEXTS.saveDate_monthLabel,
      },
      {
        key: "saveDate_yearLabel",
        label: "Label ano",
        placeholder: DEFAULT_TEXTS.saveDate_yearLabel,
      },
      {
        key: "saveDate_dayOfWeekLabel",
        label: "Label dia da semana",
        placeholder: DEFAULT_TEXTS.saveDate_dayOfWeekLabel,
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
        placeholder: DEFAULT_TEXTS.rsvp_modalTitle,
      },
      {
        key: "rsvp_nameLabel",
        label: "Label nome",
        placeholder: DEFAULT_TEXTS.rsvp_nameLabel,
      },
      {
        key: "rsvp_namePlaceholder",
        label: "Placeholder nome",
        placeholder: DEFAULT_TEXTS.rsvp_namePlaceholder,
      },
      {
        key: "rsvp_emailLabel",
        label: "Label email",
        placeholder: DEFAULT_TEXTS.rsvp_emailLabel,
      },
      {
        key: "rsvp_emailPlaceholder",
        label: "Placeholder email",
        placeholder: DEFAULT_TEXTS.rsvp_emailPlaceholder,
      },
      {
        key: "rsvp_attendingLabel",
        label: "Pergunta de comparecimento",
        placeholder: DEFAULT_TEXTS.rsvp_attendingLabel,
      },
      {
        key: "rsvp_attendingYes",
        label: "Opção sim",
        placeholder: DEFAULT_TEXTS.rsvp_attendingYes,
      },
      {
        key: "rsvp_attendingNo",
        label: "Opção não",
        placeholder: DEFAULT_TEXTS.rsvp_attendingNo,
      },
      {
        key: "rsvp_dietaryLabel",
        label: "Label restrições",
        placeholder: DEFAULT_TEXTS.rsvp_dietaryLabel,
      },
      {
        key: "rsvp_dietaryPlaceholder",
        label: "Placeholder restrições",
        placeholder: DEFAULT_TEXTS.rsvp_dietaryPlaceholder,
      },
      {
        key: "rsvp_messageLabel",
        label: "Label mensagem",
        placeholder: DEFAULT_TEXTS.rsvp_messageLabel,
      },
      {
        key: "rsvp_messagePlaceholder",
        label: "Placeholder mensagem",
        placeholder: DEFAULT_TEXTS.rsvp_messagePlaceholder,
      },
    ],
  },
  {
    id: "rsvpStates",
    label: "RSVP — Estados e Ações",
    fields: [
      {
        key: "rsvp_deadlinePrefix",
        label: "Prefixo do prazo",
        placeholder: DEFAULT_TEXTS.rsvp_deadlinePrefix,
      },
      {
        key: "rsvp_submitButton",
        label: "Botão enviar",
        placeholder: DEFAULT_TEXTS.rsvp_submitButton,
      },
      {
        key: "rsvp_submitting",
        label: "Texto enviando",
        placeholder: DEFAULT_TEXTS.rsvp_submitting,
      },
      {
        key: "rsvp_successTitle",
        label: "Título sucesso",
        placeholder: DEFAULT_TEXTS.rsvp_successTitle,
      },
      {
        key: "rsvp_successMessage",
        label: "Mensagem sucesso",
        placeholder: DEFAULT_TEXTS.rsvp_successMessage,
      },
      {
        key: "rsvp_alreadyTitle",
        label: "Título já confirmado",
        placeholder: DEFAULT_TEXTS.rsvp_alreadyTitle,
      },
      {
        key: "rsvp_alreadyMessage",
        label: "Mensagem já confirmado",
        placeholder: DEFAULT_TEXTS.rsvp_alreadyMessage,
      },
      {
        key: "rsvp_errorTitle",
        label: "Título erro",
        placeholder: DEFAULT_TEXTS.rsvp_errorTitle,
      },
      {
        key: "rsvp_errorMessage",
        label: "Mensagem erro",
        placeholder: DEFAULT_TEXTS.rsvp_errorMessage,
      },
      {
        key: "rsvp_retryButton",
        label: "Botão tentar novamente",
        placeholder: DEFAULT_TEXTS.rsvp_retryButton,
      },
      {
        key: "rsvp_closeButton",
        label: "Botão fechar",
        placeholder: DEFAULT_TEXTS.rsvp_closeButton,
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
        placeholder: DEFAULT_TEXTS.map_unavailableOffline,
      },
    ],
  },
];
