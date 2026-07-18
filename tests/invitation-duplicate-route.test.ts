import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/lib/generated/prisma/client";

const db = vi.hoisted(() => {
  const tx = {
    theme: { findUnique: vi.fn(), create: vi.fn() },
    invitation: { create: vi.fn() },
  };
  return {
    invitationFindUnique: vi.fn(),
    themeFindUnique: vi.fn(),
    transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
    tx,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    invitation: { findUnique: db.invitationFindUnique },
    theme: { findUnique: db.themeFindUnique },
    $transaction: db.transaction,
  },
}));

import { POST } from "@/app/api/admin/invitations/[id]/duplicate/route";
import {
  duplicateForm,
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";

function post(body: unknown) {
  return POST({ json: async () => body } as Parameters<typeof POST>[0], {
    params: Promise.resolve({ id: "inv_source" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.invitationFindUnique.mockImplementation(
    ({ where }: { where: { id?: string; slug?: string } }) =>
      where.id
        ? {
            id: sourceInvitationRow.id,
            couple: sourceInvitationRow.couple,
            eventType: sourceInvitationRow.eventType,
          }
        : null,
  );
  db.themeFindUnique.mockResolvedValue(sourceTheme);
  db.tx.theme.findUnique.mockResolvedValue(null);
  db.tx.theme.create.mockResolvedValue({
    ...sourceTheme,
    id: "theme_copy",
    name: "rose-garden-maria-pedro",
  });
  db.tx.invitation.create.mockResolvedValue({ id: "inv_copy" });
});

describe("POST invitation duplicate", () => {
  it("returns 404 when the source no longer exists", async () => {
    db.invitationFindUnique.mockResolvedValue(null);

    expect((await post(duplicateForm())).status).toBe(404);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects unchanged identity, malformed slug, and deleted themes", async () => {
    const unchanged = await post(duplicateForm({ slug: "ana-joao-copy" }));
    expect(unchanged.status).toBe(400);
    expect(await unchanged.json()).toMatchObject({ field: "couple" });

    const malformed = await post(
      duplicateForm({
        slug: "Maria Pedro",
        couple: { bride: "Maria", groom: "Pedro", monogram: "M&P" },
      }),
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ field: "slug" });

    db.themeFindUnique.mockResolvedValue(null);
    const missingTheme = await post(
      duplicateForm({
        slug: "maria-pedro",
        couple: { bride: "Maria", groom: "Pedro", monogram: "M&P" },
      }),
    );
    expect(missingTheme.status).toBe(400);
  });

  it("returns 409 for an existing invitation slug", async () => {
    db.invitationFindUnique.mockImplementation(
      ({ where }: { where: { id?: string; slug?: string } }) =>
        where.id
          ? {
              couple: sourceInvitationRow.couple,
              eventType: sourceInvitationRow.eventType,
            }
          : { id: "taken" },
    );

    const response = await post(
      duplicateForm({
        slug: "maria-pedro",
        couple: { bride: "Maria", groom: "Pedro", monogram: "M&P" },
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ field: "slug" });
  });

  it("creates a suffixed independent theme and reset invitation atomically", async () => {
    db.tx.theme.findUnique
      .mockResolvedValueOnce({ id: "collision" })
      .mockResolvedValueOnce(null);

    const response = await post(
      duplicateForm({
        slug: "maria-pedro",
        couple: { bride: "Maria", groom: "Pedro", monogram: "M&P" },
        isDemo: true,
        priceFromCents: 999,
        landingModelName: "Injected",
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "inv_copy" });
    expect(db.tx.theme.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "rose-garden-maria-pedro-2",
        label: "Rose Garden — Maria & Pedro",
      }),
    });
    expect(db.tx.invitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        theme: { connect: { id: "theme_copy" } },
        isDemo: false,
        priceFromCents: null,
        discountPriceFromCents: null,
        currency: "EUR",
        priceOverrides: Prisma.JsonNull,
        landingModelName: null,
        landingCustomizationLevel: "fully_customizable",
      }),
      select: { id: true },
    });
    const invitationData = db.tx.invitation.create.mock.calls[0][0].data;
    expect(invitationData).not.toHaveProperty("guests");
    expect(invitationData).not.toHaveProperty("rsvpResponses");
    expect(invitationData).not.toHaveProperty("giftReservations");
    expect(invitationData).not.toHaveProperty("landingFeatures");
    expect(invitationData).not.toHaveProperty("ownerToken");
  });

  it("maps a unique-slug race to 409 and other transaction failures to 500", async () => {
    db.transaction.mockRejectedValueOnce({ code: "P2002" });
    const body = duplicateForm({
      slug: "maria-pedro",
      couple: { bride: "Maria", groom: "Pedro", monogram: "M&P" },
    });

    expect((await post(body)).status).toBe(409);

    db.transaction.mockRejectedValueOnce(new Error("database unavailable"));
    expect((await post(body)).status).toBe(500);
  });
});
