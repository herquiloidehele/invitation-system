import { prisma } from "./db";
import {
  slugifyName,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_GUEST_MESSAGE_TEMPLATE,
} from "./guest-links";
import type {
  GuestData,
  GuestUpsertInput,
  PublicGuestData,
} from "./types";

// ---------------------------------------------------------------------------
// Internal: shape Prisma row → GuestData
// ---------------------------------------------------------------------------

type GuestRow = {
  id: string;
  invitationSlug: string;
  token: string;
  name: string;
  slugifiedName: string;
  companion: string | null;
  phoneCountryCode: string;
  phoneNumber: string;
  tableLabel: string;
  canInviteOthers: boolean;
  note: string | null;
  customExternalLink: string | null;
  invitedById: string | null;
  invitedBy: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

function toGuestData(row: GuestRow): GuestData {
  return {
    id: row.id,
    invitationSlug: row.invitationSlug,
    token: row.token,
    name: row.name,
    slugifiedName: row.slugifiedName,
    companion: row.companion ?? undefined,
    phoneCountryCode: row.phoneCountryCode,
    phoneNumber: row.phoneNumber,
    tableLabel: row.tableLabel,
    canInviteOthers: row.canInviteOthers,
    note: row.note ?? undefined,
    customExternalLink: row.customExternalLink ?? undefined,
    invitedById: row.invitedById ?? undefined,
    invitedByName: row.invitedBy?.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPublicGuestData(
  row: Pick<
    GuestRow,
    | "token"
    | "name"
    | "companion"
    | "tableLabel"
    | "note"
    | "customExternalLink"
    | "canInviteOthers"
    | "invitationSlug"
  >,
): PublicGuestData {
  return {
    token: row.token,
    name: row.name,
    companion: row.companion ?? undefined,
    tableLabel: row.tableLabel,
    note: row.note ?? undefined,
    customExternalLink: row.customExternalLink ?? undefined,
    canInviteOthers: row.canInviteOthers,
    invitationSlug: row.invitationSlug,
  };
}

const includeInviter = {
  invitedBy: { select: { name: true } },
} as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class GuestValidationError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "GuestValidationError";
    this.field = field;
  }
}

function normalizeOptionalText(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function validateUpsert(input: GuestUpsertInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new GuestValidationError("Nome é obrigatório", "name");
  }
  if (!input.phoneCountryCode || !input.phoneCountryCode.startsWith("+")) {
    throw new GuestValidationError("Indicativo inválido", "phoneCountryCode");
  }
  const digits = (input.phoneNumber ?? "").replace(/[^0-9]/g, "");
  if (digits.length < 6 || digits.length > 15) {
    throw new GuestValidationError(
      "Telefone deve ter entre 6 e 15 dígitos",
      "phoneNumber",
    );
  }
  if (!input.tableLabel || input.tableLabel.trim().length === 0) {
    throw new GuestValidationError("Mesa é obrigatória", "tableLabel");
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getGuestByToken(
  token: string,
): Promise<GuestData | null> {
  const row = await prisma.guest.findUnique({
    where: { token },
    include: includeInviter,
  });
  return row ? toGuestData(row as unknown as GuestRow) : null;
}

export async function getPublicGuestByToken(
  token: string,
): Promise<PublicGuestData | null> {
  const row = await prisma.guest.findUnique({
    where: { token },
    select: {
      token: true,
      name: true,
      companion: true,
      tableLabel: true,
      note: true,
      customExternalLink: true,
      canInviteOthers: true,
      invitationSlug: true,
    },
  });
  return row ? toPublicGuestData(row) : null;
}

export async function getGuestsForInvitation(
  invitationSlug: string,
): Promise<GuestData[]> {
  const rows = await prisma.guest.findMany({
    where: { invitationSlug },
    include: includeInviter,
    orderBy: [{ createdAt: "asc" }],
  });
  return (rows as unknown as GuestRow[]).map(toGuestData);
}

export async function createGuest(
  invitationSlug: string,
  input: GuestUpsertInput,
  options?: { invitedById?: string },
): Promise<GuestData> {
  validateUpsert(input);
  const row = await prisma.guest.create({
    data: {
      invitationSlug,
      name: input.name.trim(),
      slugifiedName: slugifyName(input.name),
      companion: input.companion?.trim() || null,
      phoneCountryCode: input.phoneCountryCode,
      phoneNumber: input.phoneNumber.replace(/\s+/g, ""),
      tableLabel: input.tableLabel.trim(),
      canInviteOthers: input.canInviteOthers ?? false,
      note: input.note?.trim() || null,
      customExternalLink: normalizeOptionalText(input.customExternalLink),
      invitedById: options?.invitedById ?? null,
    },
    include: includeInviter,
  });
  return toGuestData(row as unknown as GuestRow);
}

export async function updateGuest(
  guestId: string,
  input: Partial<GuestUpsertInput>,
): Promise<GuestData> {
  // Validate only the fields that were provided
  if (input.name !== undefined) {
    if (!input.name || input.name.trim().length === 0) {
      throw new GuestValidationError("Nome é obrigatório", "name");
    }
  }
  if (
    input.phoneCountryCode !== undefined &&
    !input.phoneCountryCode.startsWith("+")
  ) {
    throw new GuestValidationError("Indicativo inválido", "phoneCountryCode");
  }
  if (input.phoneNumber !== undefined) {
    const digits = input.phoneNumber.replace(/[^0-9]/g, "");
    if (digits.length < 6 || digits.length > 15) {
      throw new GuestValidationError(
        "Telefone deve ter entre 6 e 15 dígitos",
        "phoneNumber",
      );
    }
  }
  if (
    input.tableLabel !== undefined &&
    input.tableLabel.trim().length === 0
  ) {
    throw new GuestValidationError("Mesa é obrigatória", "tableLabel");
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) {
    data.name = input.name.trim();
    data.slugifiedName = slugifyName(input.name);
  }
  if (input.companion !== undefined) {
    data.companion = input.companion?.trim() || null;
  }
  if (input.phoneCountryCode !== undefined)
    data.phoneCountryCode = input.phoneCountryCode;
  if (input.phoneNumber !== undefined)
    data.phoneNumber = input.phoneNumber.replace(/\s+/g, "");
  if (input.tableLabel !== undefined) data.tableLabel = input.tableLabel.trim();
  if (input.canInviteOthers !== undefined)
    data.canInviteOthers = input.canInviteOthers;
  if (input.note !== undefined) data.note = input.note?.trim() || null;
  if (input.customExternalLink !== undefined) {
    data.customExternalLink = normalizeOptionalText(input.customExternalLink);
  }

  const row = await prisma.guest.update({
    where: { id: guestId },
    data,
    include: includeInviter,
  });
  return toGuestData(row as unknown as GuestRow);
}

export async function deleteGuest(guestId: string): Promise<void> {
  await prisma.guest.delete({ where: { id: guestId } });
}

/**
 * Self-register a secondary guest using a primary guest's token.
 *
 * Rules:
 *  - inviter must exist
 *  - inviter must have canInviteOthers === true
 *  - the invitation must have guestManagementEnabled === true
 *  - new guest is forced canInviteOthers = false (no chains)
 *  - phone fields are stored empty (host can fill later)
 */
export async function selfRegisterGuest(input: {
  inviterToken: string;
  name: string;
  companion?: string;
}): Promise<GuestData> {
  const inviter = await prisma.guest.findUnique({
    where: { token: input.inviterToken },
    include: { invitation: { select: { guestManagementEnabled: true } } },
  });
  if (!inviter) {
    throw new GuestValidationError("Convite não encontrado", "inviterToken");
  }
  if (!inviter.canInviteOthers) {
    throw new GuestValidationError(
      "Este convidado não pode convidar outras pessoas",
      "inviterToken",
    );
  }
  if (!inviter.invitation.guestManagementEnabled) {
    throw new GuestValidationError(
      "Gestão de convidados está desactivada",
      "inviterToken",
    );
  }
  if (!input.name || input.name.trim().length === 0) {
    throw new GuestValidationError("Nome é obrigatório", "name");
  }

  const row = await prisma.guest.create({
    data: {
      invitationSlug: inviter.invitationSlug,
      name: input.name.trim(),
      slugifiedName: slugifyName(input.name),
      companion: input.companion?.trim() || null,
      phoneCountryCode: DEFAULT_COUNTRY_CODE,
      phoneNumber: "",
      tableLabel: "",
      canInviteOthers: false,
      note: null,
      invitedById: inviter.id,
    },
    include: includeInviter,
  });
  return toGuestData(row as unknown as GuestRow);
}

// Re-export the default template so callers don't need to import from two modules
export { DEFAULT_GUEST_MESSAGE_TEMPLATE };
