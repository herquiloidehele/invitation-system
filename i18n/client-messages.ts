import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";
import type { AppLocale } from "@/i18n/locales";

const CLIENT_MESSAGES = { pt, en, es } as const;

export function getClientMessages(locale: AppLocale) {
  return CLIENT_MESSAGES[locale];
}
