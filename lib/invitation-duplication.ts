import { Prisma, type Theme } from "@/lib/generated/prisma/client";
import { toAdminInvitationInitialData } from "@/lib/invitation-admin-initial-data";
import { isWeddingEventType } from "@/lib/invitation-event-types";
import type { InvitationData } from "@/lib/types";

type AdminRow = Parameters<typeof toAdminInvitationInitialData>[0];
type CustomerIdentityInput = Pick<InvitationData, "eventType" | "couple">;

export const INVITATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function buildDuplicateInvitationInitialData(
  row: AdminRow,
): InvitationData {
  const { id: _id, ...data } = toAdminInvitationInitialData(row);
  void _id;

  return {
    ...data,
    slug: "",
    isDemo: false,
    priceFromCents: null,
    discountPriceFromCents: null,
    currency: "EUR",
    priceOverrides: null,
    landingModelName: null,
    landingImageUrl: null,
    landingDescription: null,
    landingSubtitle: null,
    landingTranslations: null,
    landingCustomizationLevel: "fully_customizable",
  };
}

function normalizeCustomerName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function invitationCustomerIdentity(
  input: CustomerIdentityInput,
): string {
  const primary = normalizeCustomerName(input.couple.bride);
  if (!isWeddingEventType(input.eventType)) return primary;

  return [primary, normalizeCustomerName(input.couple.groom)]
    .sort()
    .join("\u0000");
}

export function isSameInvitationCustomer(
  source: CustomerIdentityInput,
  candidate: CustomerIdentityInput,
): boolean {
  return (
    invitationCustomerIdentity(source) === invitationCustomerIdentity(candidate)
  );
}

export function buildDuplicateThemeName(
  baseName: string,
  invitationSlug: string,
  suffix = 1,
): string {
  const preferred = `${baseName}-${invitationSlug}`;
  return suffix === 1 ? preferred : `${preferred}-${suffix}`;
}

export function buildDuplicateThemeData(
  theme: Theme,
  name: string,
  customerDisplayName: string,
): Prisma.ThemeCreateInput {
  return {
    name,
    label: `${theme.label} — ${customerDisplayName}`,
    description: theme.description,
    envelope: theme.envelope as Prisma.InputJsonValue,
    bg: theme.bg,
    cardBg: theme.cardBg,
    cardBorder: theme.cardBorder,
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    displayFont: theme.displayFont,
    bodyFont: theme.bodyFont,
    scriptFont: theme.scriptFont,
    uiFont: theme.uiFont,
    sectionTitleFont: theme.sectionTitleFont,
    sectionTitleFontSize: theme.sectionTitleFontSize,
    sectionTitleFontWeight: theme.sectionTitleFontWeight,
    ctaPrimaryBg: theme.ctaPrimaryBg,
    ctaPrimaryText: theme.ctaPrimaryText,
    ctaSecondaryBorder: theme.ctaSecondaryBorder,
    ctaSecondaryText: theme.ctaSecondaryText,
    ctaRadius: theme.ctaRadius,
    monogramColor: theme.monogramColor,
    tapTextColor: theme.tapTextColor,
    bgGradient: theme.bgGradient,
    decorativeColor: theme.decorativeColor,
    ctaGlow: theme.ctaGlow,
    layout: theme.layout,
  };
}
