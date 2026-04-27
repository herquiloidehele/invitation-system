/**
 * Pure utilities for guest links and message rendering.
 *
 * No React, no Next.js, no Prisma — fully unit-testable. All inputs/outputs
 * are plain strings/objects.
 */

// ---------------------------------------------------------------------------
// Country codes (ordered: default first, then PT, BR, US, UK, ES, ZA)
// ---------------------------------------------------------------------------

export interface CountryCodeOption {
  code: string; // dialing prefix with leading "+", e.g. "+258"
  label: string; // human label (PT)
  flag: string; // emoji flag for UI affordance
}

export const COUNTRY_CODES: ReadonlyArray<CountryCodeOption> = [
  { code: "+258", label: "Moçambique", flag: "🇲🇿" },
  { code: "+351", label: "Portugal", flag: "🇵🇹" },
  { code: "+55", label: "Brasil", flag: "🇧🇷" },
  { code: "+1", label: "EUA / Canadá", flag: "🇺🇸" },
  { code: "+44", label: "Reino Unido", flag: "🇬🇧" },
  { code: "+34", label: "Espanha", flag: "🇪🇸" },
  { code: "+27", label: "África do Sul", flag: "🇿🇦" },
];

export const DEFAULT_COUNTRY_CODE = "+258";

// ---------------------------------------------------------------------------
// Slugifier (URL-safe ASCII slug, matches the project's existing pattern)
// ---------------------------------------------------------------------------

export function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Personal invite URL
// ---------------------------------------------------------------------------

export interface BuildPersonalInviteUrlInput {
  origin: string; // e.g. "https://example.com" (trailing slash tolerated)
  slug: string; // invitation slug
  token: string; // guest token
  name: string; // human name; will be slugified for the `n` query param
}

export function buildPersonalInviteUrl(
  input: BuildPersonalInviteUrlInput,
): string {
  const origin = input.origin.replace(/\/+$/, "");
  const params = new URLSearchParams();
  params.set("g", input.token);
  const nameSlug = slugifyName(input.name);
  if (nameSlug) params.set("n", nameSlug);
  return `${origin}/${input.slug}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Phone helpers
// ---------------------------------------------------------------------------

function stripPhoneDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function stripCountryCodePlus(code: string): string {
  return code.replace(/^\+/, "");
}

// ---------------------------------------------------------------------------
// WhatsApp URL — wa.me requires no '+', E.164 digits only
// ---------------------------------------------------------------------------

export interface BuildPhoneLinkInput {
  countryCode: string; // includes leading "+"
  phoneNumber: string; // local number, may include spaces
  message: string; // pre-rendered message
}

export function buildWhatsAppUrl(input: BuildPhoneLinkInput): string {
  const digits =
    stripCountryCodePlus(input.countryCode) +
    stripPhoneDigits(input.phoneNumber);
  const base = `https://wa.me/${digits}`;
  if (!input.message) return base;
  // encodeURIComponent so spaces become %20 (not '+')
  return `${base}?text=${encodeURIComponent(input.message)}`;
}

// ---------------------------------------------------------------------------
// SMS URL — `sms:` URI keeps the '+', body is URL-encoded
// ---------------------------------------------------------------------------

export function buildSmsUrl(input: BuildPhoneLinkInput): string {
  const fullPhone = `${input.countryCode}${stripPhoneDigits(input.phoneNumber)}`;
  const base = `sms:${fullPhone}`;
  if (!input.message) return base;
  return `${base}?body=${encodeURIComponent(input.message)}`;
}

// ---------------------------------------------------------------------------
// Message template rendering
// ---------------------------------------------------------------------------

export interface MessageTemplateVars {
  name: string;
  link: string;
}

/** Replace `{name}` and `{link}` placeholders. Unknown placeholders untouched. */
export function renderMessageTemplate(
  template: string,
  vars: MessageTemplateVars,
): string {
  return template.split("{name}").join(vars.name).split("{link}").join(vars.link);
}

// ---------------------------------------------------------------------------
// Default message template used when an invitation has no custom template
// ---------------------------------------------------------------------------

export const DEFAULT_GUEST_MESSAGE_TEMPLATE =
  "Olá {name}, estás convidado(a) para o nosso casamento. Confirma a tua presença e vê todos os detalhes aqui: {link}";
