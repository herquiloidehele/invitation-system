import type { AppLocale } from "@/i18n/locales";
import type { Currency } from "@/lib/currency/config";
import { COUNTRY_CODES } from "@/lib/guest-links";
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

export function buildCustomerWhatsappUrl(
  digits: string,
  message: string,
): string {
  const base = `https://wa.me/${digits.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
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

const PREFIX_BY_CURRENCY: Partial<Record<Currency, string>> = {
  MZN: "+258",
  BRL: "+55",
  USD: "+1",
};

/** Best guess for the WhatsApp prefix from the geo-derived currency cookie. */
export function whatsappPrefixForCurrency(
  currency: string | null | undefined,
): string {
  return PREFIX_BY_CURRENCY[currency as Currency] ?? "+351";
}

/** Split stored digits into a known dialing prefix and the national number. */
export function splitWhatsapp(digits: string | null | undefined): {
  prefix: string;
  number: string;
} {
  const clean = (digits ?? "").replace(/\D/g, "");
  if (!clean) return { prefix: "", number: "" };

  const match = [...COUNTRY_CODES]
    .map((option) => option.code.replace("+", ""))
    .sort((a, b) => b.length - a.length)
    .find((code) => clean.startsWith(code) && clean.length > code.length);

  return match
    ? { prefix: `+${match}`, number: clean.slice(match.length) }
    : { prefix: "", number: clean };
}

/** Digits-only WhatsApp value from a prefix select + national number input. */
export function joinWhatsapp(prefix: string, number: string): string {
  return `${prefix}${number}`.replace(/\D/g, "");
}
