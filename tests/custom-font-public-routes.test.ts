import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  familyFindUnique: vi.fn(),
  variantFindUnique: vi.fn(),
}));
const s3 = vi.hoisted(() => ({ getObjectStream: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    customFontFamily: { findUnique: db.familyFindUnique },
    customFontVariant: { findUnique: db.variantFindUnique },
  },
}));
vi.mock("@/lib/s3", () => s3);

import { GET as getFamily } from "@/app/api/fonts/families/[id]/route";
import { GET as getFile } from "@/app/api/fonts/files/[variantId]/route";

beforeEach(() => {
  vi.clearAllMocks();
  db.familyFindUnique.mockResolvedValue({
    id: "family-1",
    name: "Private admin name",
    cssFamily: "custom-font-family-1",
    fallbackCategory: "display",
    revision: 3,
    archivedAt: new Date("2026-01-01"),
    variants: [
      {
        id: "variant-1",
        weight: 400,
        style: "normal",
        format: "woff2",
        revision: 2,
      },
    ],
  });
  db.variantFindUnique.mockResolvedValue({
    objectKey: "uploads/fonts/family-1/variant.woff2",
    mimeType: "font/woff2",
    sizeBytes: 3,
  });
  s3.getObjectStream.mockResolvedValue({
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Uint8Array.from([1, 2, 3]));
        controller.close();
      },
    }),
    contentLength: 3,
  });
});

describe("public custom font routes", () => {
  it("returns an archived family manifest without admin metadata", async () => {
    const context = { params: Promise.resolve({ id: "family-1" }) };
    const response = await getFamily(
      new Request("http://localhost/api/fonts/families/family-1"),
      context,
    );
    const body = await response.json();

    expect(body).toEqual({
      id: "family-1",
      cssFamily: "custom-font-family-1",
      fallbackCategory: "display",
      revision: 3,
      variants: [
        {
          id: "variant-1",
          weight: 400,
          style: "normal",
          format: "woff2",
          revision: 2,
          url: "/api/fonts/files/variant-1?v=2",
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain("Private admin name");
    expect(response.headers.get("etag")).toBe('"font-family-family-1-3"');
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=0, must-revalidate",
    );

    const notModified = await getFamily(
      new Request("http://localhost/api/fonts/families/family-1", {
        headers: { "If-None-Match": '"font-family-family-1-3"' },
      }),
      context,
    );
    expect(notModified.status).toBe(304);
  });

  it("streams registered bytes with immutable caching", async () => {
    const response = await getFile(
      new Request("http://localhost/api/fonts/files/variant-1?v=2"),
      { params: Promise.resolve({ variantId: "variant-1" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("font/woff2");
    expect(response.headers.get("content-length")).toBe("3");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      Uint8Array.from([1, 2, 3]),
    );
  });
});
