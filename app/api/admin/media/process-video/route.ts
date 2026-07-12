import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import {
  deleteObject,
  downloadObjectToFile,
  getObjectContentLength,
  putObjectBuffer,
  putObjectFile,
  s3KeyFromUrl,
} from "@/lib/s3";
import {
  formatUploadLimit,
  getUploadMaxSizeBytes,
} from "@/lib/upload-limits";
import { extractFirstFrameJpegFromFile } from "@/lib/video-poster";
import { ensureWebSafeMp4 } from "@/lib/video-transcode";

// ffmpeg + S3 work needs the Node runtime (not edge).
export const runtime = "nodejs";

// Transcoding an HEVC clip can take longer than poster-only extraction; give a
// generous per-invocation budget. (On Railway this server is long-running, so
// this is mostly a hint for serverless-style deploys.)
export const maxDuration = 120;

// ---------------------------------------------------------------------------
// POST /api/admin/media/process-video
//
// Body: { videoUrl: string, profile?: string }
//
// 1. Normalises the video to a web-safe H.264 MP4 when needed (e.g. HEVC/.mov
//    phone recordings that many browsers can't decode). When converted, the
//    new MP4 is stored alongside the original and its URL is returned.
// 2. Extracts a first-frame poster from the final video.
//
// Returns: { url, posterUrl, transcoded }.
//   - `url` is the URL callers should persist (the converted MP4 when one was
//     produced, otherwise the original).
// Strict: any normalization or poster failure rejects the upload.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      videoUrl?: unknown;
      profile?: unknown;
    } | null;
    const videoUrl =
      body && typeof body.videoUrl === "string" ? body.videoUrl : null;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Missing 'videoUrl' in request body." },
        { status: 400 },
      );
    }

    const videoKey = s3KeyFromUrl(videoUrl);
    if (!videoKey) {
      return NextResponse.json(
        { error: "videoUrl is not an object in this app's S3 bucket." },
        { status: 400 },
      );
    }

    const profile =
      body && typeof body.profile === "string" ? body.profile : undefined;
    const maxVideoBytes = getUploadMaxSizeBytes("videos", profile);
    const formattedLimit = formatUploadLimit(maxVideoBytes);
    const contentLength = await getObjectContentLength(videoKey);
    if (contentLength !== null && contentLength > maxVideoBytes) {
      return NextResponse.json(
        { error: `Video exceeds the ${formattedLimit} processing limit.` },
        { status: 413 },
      );
    }

    const workDir = await mkdtemp(path.join(os.tmpdir(), "video-process-"));
    const inputPath = path.join(workDir, "input");
    const outputPath = path.join(workDir, "web.mp4");
    const createdKeys: string[] = [];

    try {
      await downloadObjectToFile(videoKey, inputPath, maxVideoBytes);

      // 1) Transcode to a web-safe H.264 MP4 if the source isn't already one.
      const sourceExt = (videoKey.match(/\.([^./]+)$/)?.[1] ?? "").toLowerCase();
      const transcoded = await ensureWebSafeMp4(
        inputPath,
        outputPath,
        sourceExt,
      );

      let finalUrl = videoUrl;
      let posterSourcePath = inputPath;
      if (transcoded) {
        const mp4Key = `${videoKey.replace(/\.[^/.]+$/, "")}-web.mp4`;
        finalUrl = await putObjectFile(mp4Key, outputPath, "video/mp4");
        createdKeys.push(mp4Key);
        posterSourcePath = outputPath;
      }

      // 2) Extract and persist the required poster from the final video.
      const jpeg = await extractFirstFrameJpegFromFile(posterSourcePath);
      const finalKey = s3KeyFromUrl(finalUrl) ?? videoKey;
      const posterKey = `${finalKey.replace(/\.[^/.]+$/, "")}-poster.jpg`;
      const posterUrl = await putObjectBuffer(posterKey, jpeg, "image/jpeg");
      createdKeys.push(posterKey);

      return NextResponse.json({ url: finalUrl, posterUrl, transcoded });
    } catch (err) {
      for (const key of new Set([videoKey, ...createdKeys])) {
        try {
          await deleteObject(key);
        } catch (cleanupError) {
          console.warn("[process-video] cleanup failed", key, cleanupError);
        }
      }
      if (err instanceof Error && err.message.includes("byte limit")) {
        return NextResponse.json(
          { error: `Video exceeds the ${formattedLimit} processing limit.` },
          { status: 413 },
        );
      }
      throw err;
    } finally {
      rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  } catch (err) {
    console.error("[process-video] Failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to process the video.",
      },
      { status: 500 },
    );
  }
}
