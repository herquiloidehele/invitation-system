export const WHATSAPP_NUMBER = "351910671757";
export const DISPLAY_WHATSAPP_NUMBER = "+351 910 671 757";
export const DEFAULT_WHATSAPP_MESSAGE =
  "Olá! Gostava de pedir um orçamento para um convite digital Brindeal.";

export type ContactMessageFields = {
  name: string;
  eventType: string;
  date: string;
  guests: string;
  message: string;
};

export function buildWhatsappUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildContactMessage(fields: ContactMessageFields) {
  return [
    DEFAULT_WHATSAPP_MESSAGE,
    fields.name.trim() && `Nome: ${fields.name.trim()}`,
    fields.eventType.trim() && `Tipo de evento: ${fields.eventType.trim()}`,
    fields.date.trim() && `Data: ${fields.date.trim()}`,
    fields.guests.trim() && `Convidados: ${fields.guests.trim()}`,
    fields.message.trim() && `Mensagem: ${fields.message.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}
