import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import {
  downloadObjectToFile,
  getObjectContentLength,
  putObjectBuffer,
  s3KeyFromUrl,
} from "@/lib/s3";
import { extractFirstFrameJpegFromFile } from "@/lib/video-poster";

// ffmpeg + S3 work needs the Node runtime (not edge).
export const runtime = "nodejs";

// First-frame extraction can take a while for large videos. Bump the
// per-invocation budget so a 100 MB MP4 doesn't time out at ~10s.
export const maxDuration = 60;

// We refuse to process anything that the upload route itself wouldn't have
// allowed in the first place — the same 100 MB cap.
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

// ---------------------------------------------------------------------------
// POST /api/admin/media/extract-poster
//
// Body: { videoUrl: string }
//
// Returns: { posterUrl: string } on success.
// Returns 4xx with { error } when the input is invalid or the host bucket
// doesn't recognise the URL. Returns 500 on transient/extraction failures
// — callers should treat this as best-effort and continue without a poster.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { videoUrl?: unknown }
      | null;
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

    const contentLength = await getObjectContentLength(videoKey);
    if (contentLength !== null && contentLength > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        {
          error:
            "Video exceeds the 100 MB limit for server-side poster extraction.",
        },
        { status: 413 },
      );
    }

    const workDir = await mkdtemp(
      path.join(os.tmpdir(), "video-poster-input-"),
    );
    const inputPath = path.join(workDir, "input");

    try {
      await downloadObjectToFile(videoKey, inputPath, MAX_VIDEO_BYTES);
      const jpeg = await extractFirstFrameJpegFromFile(inputPath);

      // Store the poster next to the video, sharing the same name plus
      // -poster.jpg so it's easy to associate the two by inspection.
      const posterKey = `${videoKey.replace(/\.[^/.]+$/, "")}-poster.jpg`;
      const posterUrl = await putObjectBuffer(posterKey, jpeg, "image/jpeg");

      return NextResponse.json({ posterUrl });
    } catch (err) {
      if (err instanceof Error && err.message.includes("byte limit")) {
        return NextResponse.json(
          {
            error:
              "Video exceeds the 100 MB limit for server-side poster extraction.",
          },
          { status: 413 },
        );
      }
      throw err;
    } finally {
      rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  } catch (err) {
    console.error("[extract-poster] Failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to extract video poster.",
      },
      { status: 500 },
    );
  }
}
