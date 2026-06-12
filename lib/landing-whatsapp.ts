const WHATSAPP_NUMBER = "351910671757";
export const DISPLAY_WHATSAPP_NUMBER = "+351 910 671 757";
const DEFAULT_CONTACT_MESSAGE =
  "Olá! Gostava de pedir um orçamento para um convite digital Brindeal.";

const DEFAULT_CONTACT_MESSAGE_LABELS = {
  name: "Nome",
  eventType: "Tipo de evento",
  message: "Mensagem",
} as const;

export type ContactMessageFields = {
  name: string;
  eventType: string;
  message: string;
};

export type ContactMessageLabels = Record<keyof ContactMessageFields, string>;

export function buildWhatsappUrl(message = DEFAULT_CONTACT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildPurchaseMessage(title: string, fallbackTitle = "Convite") {
  const modelTitle = title.trim() || fallbackTitle;
  return `Olá! Quero comprar o modelo ${modelTitle}.`;
}

export function buildContactMessage({
  fields,
  intro = DEFAULT_CONTACT_MESSAGE,
  labels = DEFAULT_CONTACT_MESSAGE_LABELS,
}: {
  fields: ContactMessageFields;
  intro?: string;
  labels?: ContactMessageLabels;
}) {
  return [
    intro,
    fields.name.trim() && `${labels.name}: ${fields.name.trim()}`,
    fields.eventType.trim() &&
      `${labels.eventType}: ${fields.eventType.trim()}`,
    fields.message.trim() && `${labels.message}: ${fields.message.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}
