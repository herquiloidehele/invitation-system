import { beforeEach, describe, expect, it, vi } from "vitest";

// Reset wipes every AI artifact for an invitation: all builds (which cascade to
// revisions, messages and attachments at the DB level) plus their S3 objects —
// published bundles and uploaded attachments alike — leaving the invitation in
// the empty state of a freshly-created AI invitation.

const db = vi.hoisted(() => ({
  aiBuildFindMany: vi.fn(),
  aiBuildDeleteMany: vi.fn(),
  invitationUpdate: vi.fn(),
  // The array form of $transaction: our operations are already-invoked mocks,
  // so just resolve them together.
  transaction: vi.fn(async (ops: unknown[]) =>
    Promise.all(ops as Promise<unknown>[]),
  ),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    aiBuild: {
      findMany: db.aiBuildFindMany,
      deleteMany: db.aiBuildDeleteMany,
    },
    invitation: { update: db.invitationUpdate },
    $transaction: db.transaction,
  },
}));

const s3 = vi.hoisted(() => ({ deleteObject: vi.fn() }));
vi.mock("@/lib/s3", () => ({
  deleteObject: s3.deleteObject,
  // resetInvitationAi only needs deleteObject, but persistence.ts imports more.
  publicUrlForKey: vi.fn((k: string) => `https://cdn.example/${k}`),
  putObjectBuffer: vi.fn(),
}));

import { resetInvitationAi } from "@/worker/persistence";

beforeEach(() => {
  vi.clearAllMocks();
  db.invitationUpdate.mockResolvedValue({});
  db.aiBuildDeleteMany.mockResolvedValue({ count: 2 });
  s3.deleteObject.mockResolvedValue(undefined);
});

describe("resetInvitationAi", () => {
  it("deletes every bundle + attachment object, then wipes builds and clears the active revision", async () => {
    db.aiBuildFindMany.mockResolvedValue([
      {
        id: "build_1",
        revisions: [{ bundleKey: "bundles/a.js" }, { bundleKey: null }],
        attachments: [{ objectKey: "uploads/pic.png" }],
      },
      {
        id: "build_2",
        revisions: [{ bundleKey: "bundles/b.js" }],
        attachments: [],
      },
    ]);

    const result = await resetInvitationAi("inv_1");

    // Both published bundles and the one upload are deleted (best effort).
    expect(s3.deleteObject).toHaveBeenCalledWith("bundles/a.js");
    expect(s3.deleteObject).toHaveBeenCalledWith("bundles/b.js");
    expect(s3.deleteObject).toHaveBeenCalledWith("uploads/pic.png");
    expect(s3.deleteObject).toHaveBeenCalledTimes(3);

    // The active-revision FK is cleared before the builds are deleted.
    expect(db.invitationUpdate).toHaveBeenCalledWith({
      where: { id: "inv_1" },
      data: { activeRevisionId: null },
    });
    expect(db.aiBuildDeleteMany).toHaveBeenCalledWith({
      where: { invitationId: "inv_1" },
    });
    expect(db.transaction).toHaveBeenCalledTimes(1);

    expect(result).toEqual({ builds: 2, revisions: 3, deletedObjects: 3 });
  });

  it("is a no-op-safe idempotent wipe when there is nothing generated yet", async () => {
    db.aiBuildFindMany.mockResolvedValue([]);
    db.aiBuildDeleteMany.mockResolvedValue({ count: 0 });

    const result = await resetInvitationAi("inv_empty");

    expect(s3.deleteObject).not.toHaveBeenCalled();
    // Still clears the FK and runs the (empty) delete — cheap and keeps the
    // path uniform.
    expect(db.invitationUpdate).toHaveBeenCalledWith({
      where: { id: "inv_empty" },
      data: { activeRevisionId: null },
    });
    expect(result).toEqual({ builds: 0, revisions: 0, deletedObjects: 0 });
  });

  it("swallows a failed S3 delete and still wipes the database", async () => {
    db.aiBuildFindMany.mockResolvedValue([
      {
        id: "build_1",
        revisions: [{ bundleKey: "bundles/gone.js" }],
        attachments: [],
      },
    ]);
    s3.deleteObject.mockRejectedValue(new Error("S3 down"));

    const result = await resetInvitationAi("inv_1");

    expect(db.aiBuildDeleteMany).toHaveBeenCalledWith({
      where: { invitationId: "inv_1" },
    });
    // The failed object is not counted as deleted, but the wipe proceeds.
    expect(result).toEqual({ builds: 1, revisions: 1, deletedObjects: 0 });
  });
});
