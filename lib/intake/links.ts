import type { AppLocale } from "@/i18n/locales";
import { buildAbsoluteUrl, buildLocalePath } from "@/lib/seo";
import type { IntakeKind } from "./catalog";

/** The customer's personal intake link, e.g. /personalizar/<token>. */
export function buildIntakePath(token: string, locale: AppLocale): string {
  return buildLocalePath(`/personalizar/${encodeURIComponent(token)}`, locale);
}

export function buildIntakeUrl(
  origin: string,
  token: string,
  locale: AppLocale,
): string {
  return buildAbsoluteUrl(origin, buildIntakePath(token, locale));
}

/** Self-start entry from the landing details page. */
export function buildSelfStartPath(
  kind: IntakeKind,
  demoSlug: string,
  locale: AppLocale,
): string {
  return buildLocalePath(
    `/personalizar/novo/${kind}/${encodeURIComponent(demoSlug)}`,
    locale,
  );
}

/** Short human reference quoted in WhatsApp messages. */
export function intakeRef(id: string): string {
  return id.slice(-6).toUpperCase();
}

/** WhatsApp share link: the admin picks the chat to send the message to. */
export function buildWhatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Message the studio sends with the personal link (admin copy is Portuguese). */
export function buildAdminInviteMessage({
  name,
  demoName,
  url,
}: {
  name: string;
  demoName: string;
  url: string;
}): string {
  const greeting = name.trim() ? `Olá ${name.trim()}!` : "Olá!";
  return `${greeting} Para criarmos o seu convite com o modelo ${demoName}, preencha por favor este formulário: ${url}`;
}
