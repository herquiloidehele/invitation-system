/**
 * Server-side helper that extracts the first frame of a video file as a
 * JPEG buffer using the bundled `ffmpeg-static` binary.
 *
 * The function works on a temporary file rather than streaming bytes
 * because ffmpeg cannot reliably seek inside an MP4 (where the moov atom
 * may sit at the end of the file) when reading from a non-seekable stdin
 * pipe. Writing to a temp file is the safest path across container types.
 *
 * The returned image is rendered to a max width of 1280px to keep the
 * stored asset small, and encoded at JPEG quality ≈85 (ffmpeg `-q:v 4`).
 */

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import ffmpegStatic from "ffmpeg-static";

const ffmpegPath = ffmpegStatic;

export class PosterExtractionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PosterExtractionError";
  }
}

/**
 * Run a subprocess and resolve with stderr (captured for diagnostics) when
 * it exits with code 0; reject with the captured stderr otherwise.
 */
function runFfmpeg(binary: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "ignore", "pipe"] });

    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve(stderr);
      } else {
        reject(
          new PosterExtractionError(
            `ffmpeg exited with code ${code}: ${stderr.trim().slice(0, 500)}`,
          ),
        );
      }
    });
  });
}

/**
 * Extracts the first frame of `videoBuffer` as a JPEG.
 *
 * Resolves to the JPEG bytes; rejects with `PosterExtractionError` if the
 * binary is unavailable or ffmpeg returns a non-zero exit code.
 */
export async function extractFirstFrameJpeg(
  videoBuffer: Buffer,
): Promise<Buffer> {
  if (!ffmpegPath) {
    throw new PosterExtractionError(
      "ffmpeg-static did not resolve to a binary path on this platform",
    );
  }

  const workDir = await mkdtemp(path.join(os.tmpdir(), "video-poster-"));
  const inputPath = path.join(workDir, "input");
  const outputPath = path.join(workDir, "frame.jpg");

  try {
    await writeFile(inputPath, videoBuffer);

    // -ss 0 → seek to start
    // -frames:v 1 → emit a single frame
    // -vf scale=… → cap width to 1280, preserve aspect ratio
    // -q:v 4 → JPEG quality (~85)
    // -f image2 -an → image2 muxer, no audio
    await runFfmpeg(ffmpegPath, [
      "-y",
      "-loglevel",
      "error",
      "-ss",
      "0",
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-vf",
      "scale='min(1280,iw)':-2",
      "-q:v",
      "4",
      "-f",
      "image2",
      "-an",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    // Best-effort cleanup; never let it mask a real error.
    rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
