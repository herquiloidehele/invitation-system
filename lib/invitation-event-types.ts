import type { InvitationEventType } from "./types";

export const INVITATION_EVENT_TYPES = [
  "wedding",
  "anniversary",
  "baptism",
  "engagement",
  "other",
] as const satisfies readonly InvitationEventType[];

const EVENT_TYPE_SET = new Set<string>(INVITATION_EVENT_TYPES);

export function normalizeInvitationEventType(
  value: unknown,
): InvitationEventType {
  return typeof value === "string" && EVENT_TYPE_SET.has(value)
    ? (value as InvitationEventType)
    : "wedding";
}

export function isWeddingEventType(value: InvitationEventType): boolean {
  return value === "wedding";
}

export function isEngagementEventType(value: InvitationEventType): boolean {
  return value === "engagement";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface InvitationNameInput {
  eventType: InvitationEventType;
  primaryName: string;
  secondaryName?: string;
}

export function buildInvitationDisplayName({
  eventType,
  primaryName,
  secondaryName = "",
}: InvitationNameInput): string {
  return isWeddingEventType(eventType) && secondaryName
    ? `${primaryName} & ${secondaryName}`
    : primaryName;
}

export function buildInvitationSlug({
  eventType,
  primaryName,
  secondaryName = "",
}: InvitationNameInput): string {
  return slugify(
    isWeddingEventType(eventType)
      ? `${primaryName}-${secondaryName}`
      : primaryName,
  );
}

export function buildInvitationMonogram({
  eventType,
  primaryName,
  secondaryName = "",
}: InvitationNameInput): string {
  const primaryInitial = primaryName.trim().charAt(0).toUpperCase();
  const secondaryInitial = secondaryName.trim().charAt(0).toUpperCase();

  if (!isWeddingEventType(eventType)) return primaryInitial;
  return primaryInitial && secondaryInitial
    ? `${primaryInitial}&${secondaryInitial}`
    : "";
}
