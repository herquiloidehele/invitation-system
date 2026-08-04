import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const tx = {
    customFontFamily: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customFontVariant: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    familyFindUnique: vi.fn(),
    familyFindMany: vi.fn(),
    familyCount: vi.fn(),
    familyUpdate: vi.fn(),
    transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
    tx,
  };
});

const storage = vi.hoisted(() => ({
  readFontObject: vi.fn(),
  copyPendingFontToPermanent: vi.fn(),
  deletePendingFont: vi.fn(),
  cleanupFontObject: vi.fn(),
}));

const usage = vi.hoisted(() => ({ findCustomFontUsages: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    customFontFamily: {
      findUnique: db.familyFindUnique,
      findMany: db.familyFindMany,
      count: db.familyCount,
      update: db.familyUpdate,
    },
    $transaction: db.transaction,
  },
}));

vi.mock("@/lib/custom-fonts/storage", () => storage);
vi.mock("@/lib/custom-fonts/usage", () => usage);

import {
  addCustomFontVariant,
  createCustomFontFamily,
  deleteCustomFontFamily,
} from "@/lib/custom-fonts/admin-service";

const analysis = {
  familyName: "Atelier",
  weight: 400,
  style: "normal" as const,
  format: "woff2" as const,
  mimeType: "font/woff2",
  sizeBytes: 1024,
  checksum: "checksum-1",
  metadata: { postscriptName: "Atelier-Regular" },
};

const oldVariant = {
  id: "variant-old",
  familyId: "family-1",
  weight: 400,
  style: "normal",
  format: "woff2",
  objectKey: "uploads/fonts/family-1/old.woff2",
  originalFileName: "old.woff2",
  mimeType: "font/woff2",
  sizeBytes: 900,
  checksum: "old-checksum",
  metadata: {},
  revision: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const family = {
  id: "family-1",
  name: "Atelier",
  normalizedName: "atelier",
  cssFamily: "custom-font-family-1",
  fallbackCategory: "display",
  revision: 1,
  archivedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  variants: [oldVariant],
};

beforeEach(() => {
  vi.clearAllMocks();
  storage.readFontObject.mockResolvedValue({ buffer: Buffer.from("font"), analysis });
  storage.copyPendingFontToPermanent.mockResolvedValue(
    "uploads/fonts/family-1/new.woff2",
  );
  storage.deletePendingFont.mockResolvedValue(undefined);
  storage.cleanupFontObject.mockResolvedValue(undefined);
  usage.findCustomFontUsages.mockResolvedValue([]);
  db.familyFindUnique.mockResolvedValue(family);
  db.tx.customFontFamily.update.mockResolvedValue({ ...family, revision: 2 });
  db.tx.customFontVariant.update.mockResolvedValue({
    ...oldVariant,
    objectKey: "uploads/fonts/family-1/new.woff2",
    checksum: analysis.checksum,
    revision: 2,
  });
});

describe("custom font lifecycle service", () => {
  it("requires explicit confirmation before replacing an occupied slot", async () => {
    await expect(
      addCustomFontVariant("family-1", {
        pendingKey: "uploads/fonts/pending/new.woff2",
        originalFileName: "new.woff2",
        expectedChecksum: analysis.checksum,
        weight: 400,
        style: "normal",
        replace: false,
      }),
    ).rejects.toMatchObject({ code: "replacement_required" });
    expect(storage.copyPendingFontToPermanent).not.toHaveBeenCalled();
  });

  it("switches persistence before cleaning the replaced object", async () => {
    const result = await addCustomFontVariant("family-1", {
      pendingKey: "uploads/fonts/pending/new.woff2",
      originalFileName: "new.woff2",
      expectedChecksum: analysis.checksum,
      weight: 400,
      style: "normal",
      replace: true,
    });

    expect(result.variants[0].revision).toBe(2);
    expect(db.transaction.mock.invocationCallOrder[0]).toBeLessThan(
      storage.cleanupFontObject.mock.invocationCallOrder[0],
    );
    expect(storage.cleanupFontObject).toHaveBeenCalledWith(oldVariant.objectKey);
  });

  it("normalizes the family name and derives its immutable CSS identity", async () => {
    db.familyFindUnique.mockResolvedValue(null);
    db.tx.customFontFamily.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        ...family,
        ...data,
        variants: [
          {
            ...oldVariant,
            ...(data.variants as { create: Record<string, unknown> }).create,
          },
        ],
      }),
    );

    const result = await createCustomFontFamily({
      name: "  Minha   Fonte ",
      fallbackCategory: "display",
      pendingKey: "uploads/fonts/pending/new.woff2",
      originalFileName: "new.woff2",
      expectedChecksum: analysis.checksum,
      weight: 400,
      style: "normal",
      replace: false,
    });

    expect(result.family).toBe("Minha Fonte");
    expect(db.tx.customFontFamily.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        normalizedName: "minha fonte",
        cssFamily: expect.stringMatching(/^custom-font-/),
      }),
      include: { variants: true },
    });
  });

  it("blocks permanent deletion and returns concrete usages", async () => {
    usage.findCustomFontUsages.mockResolvedValue([
      { kind: "theme", id: "theme-1", label: "rose" },
    ]);

    await expect(deleteCustomFontFamily("family-1")).rejects.toMatchObject({
      code: "font_in_use",
      usages: [{ kind: "theme", id: "theme-1", label: "rose" }],
    });
    expect(db.tx.customFontFamily.delete).not.toHaveBeenCalled();
  });
});
