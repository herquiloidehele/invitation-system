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

/** Client hook — returns a resolver bound to the current request locale. */
export function useCustomText(
  customTexts: CustomTexts | undefined | null,
): (key: keyof CustomTexts, values?: Record<string, string>) => string {
  const tn = useTranslations("Invitation");
  return (key, values) => {
    const override = customTexts?.[key];
    if (override) return override;
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
  if (override) return override;
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
        key: "rsvp_deadlinePrefix",
        label: "Prefixo do prazo",
        placeholder: "Confirme até",
      },
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
];
