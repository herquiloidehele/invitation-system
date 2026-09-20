import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { invitation: { findUnique, update } },
}));

import { PUT } from "@/app/api/admin/invitations/[id]/block/route";

function put(body: unknown, id = "inv_1") {
  const request = { json: async () => body } as Parameters<typeof PUT>[0];
  return PUT(request, { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  findUnique.mockReset();
  update.mockReset();
  findUnique.mockResolvedValue({ id: "inv_1" });
  update.mockImplementation(
    async ({ data }: { data: Record<string, unknown> }) => ({
      id: "inv_1",
      ...data,
    }),
  );
});

describe("PUT /api/admin/invitations/[id]/block", () => {
  it("blocks with a trimmed reason and returns the new state", async () => {
    const res = await put({ blocked: true, reason: "  Pagamento em falta " });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { id: "inv_1" },
      data: { blockedAt: expect.any(Date), blockedReason: "Pagamento em falta" },
      select: { id: true, blockedAt: true, blockedReason: true },
    });
    expect(await res.json()).toMatchObject({
      id: "inv_1",
      blockedReason: "Pagamento em falta",
    });
  });

  it("stores a null reason when the reason is blank or omitted", async () => {
    await put({ blocked: true, reason: "   " });
    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { blockedAt: expect.any(Date), blockedReason: null },
      }),
    );

    await put({ blocked: true });
    expect(update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { blockedAt: expect.any(Date), blockedReason: null },
      }),
    );
  });

  it("unblocks by clearing both fields and ignores any reason", async () => {
    const res = await put({ blocked: false, reason: "should be ignored" });

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { blockedAt: null, blockedReason: null },
      }),
    );
  });

  it("answers 404 for an unknown id without updating", async () => {
    findUnique.mockResolvedValue(null);

    const res = await put({ blocked: true }, "missing");

    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("answers 400 for an invalid body without updating", async () => {
    const res = await put({ blocked: "yes" });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid body" });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects reasons longer than 500 characters", async () => {
    const res = await put({ blocked: true, reason: "x".repeat(501) });

    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});
