import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  MEDIA_CACHE_CONTROL,
  mediaUploadHeaders,
} from "@/lib/media-cache-control";

describe("mediaUploadHeaders", () => {
  it("carries both the content type and the cache policy", () => {
    expect(mediaUploadHeaders("video/mp4")).toEqual({
      "Content-Type": "video/mp4",
      "Cache-Control": MEDIA_CACHE_CONTROL,
    });
  });

  it("caches for a year without revalidation", () => {
    expect(MEDIA_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
  });
});

describe("S3 writes", () => {
  const s3 = readFileSync("lib/s3.ts", "utf8");

  it.each(["putObjectBuffer", "putObjectFile", "copyObject"])(
    "%s sets the cache policy",
    (fn) => {
      const body = s3.slice(
        s3.indexOf(`export async function ${fn}`),
        s3.indexOf(`export async function ${fn}`) + 900,
      );
      expect(body).toContain("CacheControl: MEDIA_CACHE_CONTROL");
    },
  );

  it("does not set CacheControl on the presigned command", () => {
    // The AWS presigner silently drops it — the signature is byte-identical
    // with and without — so setting it there would only be misleading.
    const presign = s3.slice(
      s3.indexOf("export async function generatePresignedUploadUrl"),
      s3.indexOf("export function publicUrlForKey"),
    );
    expect(presign).not.toContain("CacheControl:");
  });
});

describe("browser uploads", () => {
  it.each([
    "components/admin/MediaUpload.tsx",
    "components/admin/CustomFontUploadDialog.tsx",
    "app/admin/invitations/[id]/ai/AttachmentPicker.tsx",
    "app/admin/invitations/[id]/ai/FontUploadControl.tsx",
  ])("%s sends Cache-Control on the presigned PUT", (path) => {
    const source = readFileSync(path, "utf8");
    expect(source).toContain(
      'import { mediaUploadHeaders } from "@/lib/media-cache-control"',
    );
    expect(source).toContain("headers: mediaUploadHeaders(");
    // A bare Content-Type header on the PUT would silently lose the policy.
    expect(source).not.toMatch(/headers: \{ "Content-Type": [^}]*\},\s*\n\s*(body: file|onUploadProgress)/);
  });
});
