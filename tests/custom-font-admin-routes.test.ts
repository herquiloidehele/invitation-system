import { beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({
  analyzePendingFont: vi.fn(),
  listCustomFontFamilies: vi.fn(),
  getCustomFontFamily: vi.fn(),
  createCustomFontFamily: vi.fn(),
  addCustomFontVariant: vi.fn(),
  updateCustomFontFamily: vi.fn(),
  deleteCustomFontFamily: vi.fn(),
}));

const storage = vi.hoisted(() => ({
  isPendingFontKey: vi.fn(),
  deletePendingFont: vi.fn(),
}));

const s3 = vi.hoisted(() => ({ generatePresignedUploadUrl: vi.fn() }));

vi.mock("@/lib/custom-fonts/admin-service", () => service);
vi.mock("@/lib/custom-fonts/storage", () => ({
  ...storage,
  FONT_MAX_BYTES: 10 * 1024 * 1024,
}));
vi.mock("@/lib/s3", () => s3);

import {
  DELETE as cancelPending,
  POST as analyze,
} from "@/app/api/admin/custom-fonts/analyze/route";
import { POST as presign } from "@/app/api/admin/custom-fonts/presign/route";
import {
  GET as listFamilies,
  POST as createFamily,
} from "@/app/api/admin/custom-fonts/route";
import {
  DELETE as removeFamily,
  GET as getFamily,
  PATCH as updateFamily,
} from "@/app/api/admin/custom-fonts/[id]/route";
import { POST as addVariant } from "@/app/api/admin/custom-fonts/[id]/variants/route";

function request(body: unknown, url = "http://localhost/api/admin/custom-fonts") {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const context = { params: Promise.resolve({ id: "family-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  storage.isPendingFontKey.mockReturnValue(true);
  storage.deletePendingFont.mockResolvedValue(undefined);
  s3.generatePresignedUploadUrl.mockResolvedValue({
    presignedUrl: "https://upload.example",
    publicUrl: "https://public.example",
    key: "uploads/fonts/pending/uuid-face.woff2",
  });
  service.analyzePendingFont.mockResolvedValue({
    familyName: "Atelier",
    weight: 400,
    style: "normal",
    checksum: "sha256",
  });
  service.listCustomFontFamilies.mockResolvedValue({
    families: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  service.getCustomFontFamily.mockResolvedValue({ id: "family-1" });
  service.createCustomFontFamily.mockResolvedValue({ id: "family-1" });
  service.addCustomFontVariant.mockResolvedValue({ id: "family-1" });
  service.updateCustomFontFamily.mockResolvedValue({ id: "family-1" });
  service.deleteCustomFontFamily.mockResolvedValue(undefined);
});

describe("custom font admin routes", () => {
  it("presigns only supported font files within the byte limit", async () => {
    const ok = await presign(
      request({
        fileName: "face.woff2",
        fileType: "font/woff2",
        fileSize: 1024,
      }),
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({
      presignedUrl: "https://upload.example",
      pendingKey: "uploads/fonts/pending/uuid-face.woff2",
    });

    expect(
      (
        await presign(
          request({
            fileName: "face.ttc",
            fileType: "font/collection",
            fileSize: 1024,
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await presign(
          request({
            fileName: "huge.otf",
            fileType: "font/otf",
            fileSize: 10 * 1024 * 1024 + 1,
          }),
        )
      ).status,
    ).toBe(413);
  });

  it("analyzes and cancels only valid pending keys", async () => {
    const response = await analyze(
      request({ pendingKey: "uploads/fonts/pending/a.woff2" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      familyName: "Atelier",
      weight: 400,
      style: "normal",
      checksum: "sha256",
    });

    expect(
      (
        await cancelPending(
          request({ pendingKey: "uploads/fonts/pending/a.woff2" }),
        )
      ).status,
    ).toBe(204);
  });

  it("lists, gets, creates, and updates through explicit service inputs", async () => {
    const list = await listFamilies(
      new Request(
        "http://localhost/api/admin/custom-fonts?search=atelier&archived=all&page=2&limit=20",
      ),
    );
    expect(list.status).toBe(200);
    expect(service.listCustomFontFamilies).toHaveBeenCalledWith({
      search: "atelier",
      archived: "all",
      page: 2,
      limit: 20,
    });

    expect((await getFamily(new Request("http://localhost"), context)).status).toBe(200);
    expect((await createFamily(request({ name: "Atelier" }))).status).toBe(201);
    expect(
      (await updateFamily(request({ archived: true }), context)).status,
    ).toBe(200);
  });

  it("maps replacement and in-use conflicts to 409 responses", async () => {
    service.addCustomFontVariant.mockRejectedValueOnce({
      code: "replacement_required",
      message: "This slot exists",
      details: { variant: { id: "variant-1" } },
    });
    const replacement = await addVariant(request({ replace: false }), context);
    expect(replacement.status).toBe(409);
    expect(await replacement.json()).toMatchObject({
      code: "replacement_required",
    });

    service.deleteCustomFontFamily.mockRejectedValueOnce({
      code: "font_in_use",
      message: "Still in use",
      details: {
        usages: [{ kind: "theme", id: "theme-1", label: "rose" }],
      },
    });
    const blocked = await removeFamily(
      new Request("http://localhost", { method: "DELETE" }),
      context,
    );
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toMatchObject({
      code: "font_in_use",
      usages: [{ kind: "theme", id: "theme-1", label: "rose" }],
    });
  });
});
