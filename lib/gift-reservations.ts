import { randomBytes } from "node:crypto";

import {
  normalizePublicGuestName,
  projectGiftAvailability,
  type GiftAvailability,
  type GiftReservationOwnerRow,
} from "@/lib/gift-reservation-domain";
import { isExclusiveGiftSelectionEnabled } from "@/lib/gift-registry";
import type { GiftItem, GiftRegistry } from "@/lib/types";
import { prisma } from "@/lib/db";

export type GiftReservationErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "disabled"
  | "conflict";

export class GiftReservationError extends Error {
  constructor(
    public readonly code: GiftReservationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GiftReservationError";
  }
}

export function giftReservationErrorStatus(
  code: GiftReservationErrorCode,
): number {
  return {
    bad_request: 400,
    unauthorized: 401,
    forbidden: 403,
    not_found: 404,
    conflict: 409,
    disabled: 422,
  }[code];
}

type IdentityInput = {
  slug: string;
  guestToken?: string;
  managementToken?: string;
};

export type ChooseGiftInput = IdentityInput & {
  giftItemId: string;
  guestName?: string;
};

type MutationResult = {
  availability: GiftAvailability[];
  managementToken?: string;
};

type ExclusiveInvitation = {
  slug: string;
  registry: GiftRegistry;
  items: GiftItem[];
};

type ReservationIdentity =
  | { kind: "guest"; guestId: string; guestName: string }
  | {
      kind: "public";
      guestName: string;
      managementToken: string;
      issuedManagementToken?: string;
    };

function asGiftRegistry(value: unknown): GiftRegistry {
  return (value ?? { enabled: false, text: "" }) as GiftRegistry;
}

async function loadExclusiveInvitation(
  slug: string,
): Promise<ExclusiveInvitation> {
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: { slug: true, giftRegistry: true },
  });
  if (!invitation) {
    throw new GiftReservationError("not_found", "Invitation not found");
  }

  const registry = asGiftRegistry(invitation.giftRegistry);
  if (!registry.enabled || !isExclusiveGiftSelectionEnabled(registry)) {
    throw new GiftReservationError(
      "disabled",
      "Gift reservations are disabled",
    );
  }

  return {
    slug: invitation.slug,
    registry,
    items: registry.items ?? [],
  };
}

async function resolvePersonalizedGuest(slug: string, token: string) {
  const guest = await prisma.guest.findUnique({
    where: { token },
    select: { id: true, invitationSlug: true, name: true },
  });
  if (!guest || guest.invitationSlug !== slug) {
    throw new GiftReservationError("unauthorized", "Invalid guest token");
  }
  return guest;
}

async function findPublicReservation(managementToken: string) {
  return prisma.giftReservation.findUnique({
    where: { managementToken },
    select: {
      id: true,
      invitationSlug: true,
      giftItemId: true,
      guestName: true,
    },
  });
}

async function ownedReservationId(
  input: IdentityInput,
): Promise<string | null> {
  if (input.guestToken) {
    const guest = await resolvePersonalizedGuest(input.slug, input.guestToken);
    const reservation = await prisma.giftReservation.findUnique({
      where: { guestId: guest.id },
      select: { id: true, invitationSlug: true },
    });
    return reservation?.invitationSlug === input.slug ? reservation.id : null;
  }

  if (input.managementToken) {
    const reservation = await findPublicReservation(input.managementToken);
    if (reservation && reservation.invitationSlug !== input.slug) {
      throw new GiftReservationError(
        "unauthorized",
        "Invalid gift reservation token",
      );
    }
    return reservation?.id ?? null;
  }

  return null;
}

export async function getGiftAvailability(
  input: IdentityInput,
): Promise<GiftAvailability[]> {
  const invitation = await loadExclusiveInvitation(input.slug);
  const [reservations, currentId] = await Promise.all([
    prisma.giftReservation.findMany({
      where: { invitationSlug: input.slug },
      select: { id: true, giftItemId: true, guestName: true },
    }),
    ownedReservationId(input),
  ]);

  return projectGiftAvailability(invitation.items, reservations, currentId);
}

async function resolveChooseIdentity(
  input: ChooseGiftInput,
): Promise<ReservationIdentity> {
  if (input.guestToken) {
    const guest = await resolvePersonalizedGuest(input.slug, input.guestToken);
    return { kind: "guest", guestId: guest.id, guestName: guest.name };
  }

  if (input.managementToken) {
    const current = await findPublicReservation(input.managementToken);
    if (current) {
      if (current.invitationSlug !== input.slug) {
        throw new GiftReservationError(
          "unauthorized",
          "Invalid gift reservation token",
        );
      }
      return {
        kind: "public",
        guestName: current.guestName,
        managementToken: input.managementToken,
      };
    }
  }

  let guestName: string;
  try {
    guestName = normalizePublicGuestName(input.guestName);
  } catch (error) {
    throw new GiftReservationError(
      "bad_request",
      error instanceof Error ? error.message : "Invalid guest name",
    );
  }
  const managementToken = randomBytes(32).toString("base64url");
  return {
    kind: "public",
    guestName,
    managementToken,
    issuedManagementToken: managementToken,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function chooseGift(
  input: ChooseGiftInput,
): Promise<MutationResult> {
  const invitation = await loadExclusiveInvitation(input.slug);
  const gift = invitation.items.find((item) => item.id === input.giftItemId);
  if (!gift) {
    throw new GiftReservationError("not_found", "Gift not found");
  }
  const identity = await resolveChooseIdentity(input);

  try {
    await prisma.$transaction(async (tx) => {
      const current =
        identity.kind === "guest"
          ? await tx.giftReservation.findUnique({
              where: { guestId: identity.guestId },
            })
          : await tx.giftReservation.findUnique({
              where: { managementToken: identity.managementToken },
            });

      if (current && current.invitationSlug !== input.slug) {
        throw new GiftReservationError(
          "unauthorized",
          "Reservation belongs to another invitation",
        );
      }
      if (current?.giftItemId === gift.id) return;
      if (current) {
        await tx.giftReservation.delete({ where: { id: current.id } });
      }

      await tx.giftReservation.create({
        data: {
          invitationSlug: invitation.slug,
          giftItemId: gift.id,
          giftName: gift.name,
          guestName: identity.guestName,
          guestId: identity.kind === "guest" ? identity.guestId : null,
          managementToken:
            identity.kind === "public" ? identity.managementToken : null,
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new GiftReservationError("conflict", "Gift already reserved");
    }
    throw error;
  }

  const managementToken =
    identity.kind === "public" ? identity.managementToken : undefined;
  return {
    availability: await getGiftAvailability({
      slug: input.slug,
      guestToken: input.guestToken,
      managementToken,
    }),
    ...(identity.kind === "public" && identity.issuedManagementToken
      ? { managementToken: identity.issuedManagementToken }
      : {}),
  };
}

export async function releaseGuestGift(
  input: IdentityInput,
): Promise<MutationResult> {
  await loadExclusiveInvitation(input.slug);

  if (input.guestToken) {
    const guest = await resolvePersonalizedGuest(input.slug, input.guestToken);
    await prisma.giftReservation.deleteMany({
      where: { invitationSlug: input.slug, guestId: guest.id },
    });
  } else if (input.managementToken) {
    const reservation = await findPublicReservation(input.managementToken);
    if (reservation && reservation.invitationSlug !== input.slug) {
      throw new GiftReservationError(
        "unauthorized",
        "Invalid gift reservation token",
      );
    }
    if (reservation) {
      await prisma.giftReservation.delete({ where: { id: reservation.id } });
    }
  } else {
    throw new GiftReservationError(
      "unauthorized",
      "A guest or reservation token is required",
    );
  }

  return {
    availability: await getGiftAvailability(input),
  };
}

async function resolveOwnerInvitation(ownerToken: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken },
    select: { slug: true, giftRegistry: true },
  });
  if (!invitation) {
    throw new GiftReservationError("not_found", "Invitation not found");
  }
  return {
    slug: invitation.slug,
    registry: asGiftRegistry(invitation.giftRegistry),
  };
}

export async function listOwnerGiftReservations(
  ownerToken: string,
): Promise<GiftReservationOwnerRow[]> {
  const invitation = await resolveOwnerInvitation(ownerToken);
  if (!isExclusiveGiftSelectionEnabled(invitation.registry)) {
    throw new GiftReservationError(
      "disabled",
      "Gift reservations are disabled",
    );
  }

  const reservations = await prisma.giftReservation.findMany({
    where: { invitationSlug: invitation.slug },
    orderBy: { reservedAt: "desc" },
    select: {
      id: true,
      giftItemId: true,
      giftName: true,
      guestName: true,
      guestId: true,
      reservedAt: true,
    },
  });
  const currentGiftIds = new Set(
    (invitation.registry.items ?? []).map((gift) => gift.id),
  );

  return reservations.map((reservation) => ({
    id: reservation.id,
    giftItemId: reservation.giftItemId,
    giftName: reservation.giftName,
    guestName: reservation.guestName,
    source: reservation.guestId ? "personalized" : "public",
    reservedAt: reservation.reservedAt.toISOString(),
    removedFromGiftList: !currentGiftIds.has(reservation.giftItemId),
  }));
}

export async function releaseOwnerGiftReservation(
  ownerToken: string,
  reservationId: string,
): Promise<void> {
  const invitation = await resolveOwnerInvitation(ownerToken);
  const reservation = await prisma.giftReservation.findUnique({
    where: { id: reservationId },
    select: { id: true, invitationSlug: true },
  });
  if (!reservation) {
    throw new GiftReservationError("not_found", "Reservation not found");
  }
  if (reservation.invitationSlug !== invitation.slug) {
    throw new GiftReservationError("forbidden", "Forbidden");
  }
  await prisma.giftReservation.delete({ where: { id: reservation.id } });
}
