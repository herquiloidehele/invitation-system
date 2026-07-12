import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getUploadMaxSizeBytes } from "@/lib/upload-limits";
import {
  HERO_VIDEO_UPLOAD_PROFILE,
  parseProcessedVideoUpload,
} from "@/lib/video-upload";

describe("hero video uploads", () => {
  it("uses a 500 MB server limit", () => {
    expect(HERO_VIDEO_UPLOAD_PROFILE).toBe("hero-video");
    expect(getUploadMaxSizeBytes("videos", HERO_VIDEO_UPLOAD_PROFILE)).toBe(
      500 * 1024 * 1024,
    );
    expect(getUploadMaxSizeBytes("videos")).toBe(100 * 1024 * 1024);
  });

  it("accepts a complete processed-video pair", () => {
    expect(
      parseProcessedVideoUpload({
        url: "https://cdn.example.com/hero.mp4",
        posterUrl: "https://cdn.example.com/hero-poster.jpg",
      }),
    ).toEqual({
      url: "https://cdn.example.com/hero.mp4",
      posterUrl: "https://cdn.example.com/hero-poster.jpg",
    });
  });

  it.each([
    null,
    {},
    { url: "https://cdn.example.com/hero.mp4" },
    { posterUrl: "https://cdn.example.com/hero-poster.jpg" },
    { url: "", posterUrl: "https://cdn.example.com/hero-poster.jpg" },
  ])("rejects an incomplete processor response: %j", (value) => {
    expect(() => parseProcessedVideoUpload(value)).toThrow(
      "O processamento não produziu o vídeo e o poster obrigatórios.",
    );
  });

  it("requires processed metadata and hides manual URL entry for videos", () => {
    const uploader = readFileSync("components/admin/MediaUpload.tsx", "utf8");
    expect(uploader).toContain("parseProcessedVideoUpload(json)");
    expect(uploader).toContain('kind !== "video" && (');
    expect(uploader).toContain("posterUrl: posterUrl!");

    const standardForm = readFileSync(
      "app/admin/invitations/InvitationForm.tsx",
      "utf8",
    );
    const externalForm = readFileSync(
      "app/admin/invitations/ExternalInvitationForm.tsx",
      "utf8",
    );
    expect(standardForm).toContain('update("videoPoster", meta?.posterUrl');
    expect(externalForm).toContain('update("videoPoster", meta?.posterUrl');
  });
});
