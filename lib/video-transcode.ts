/**
 * Server-side helper that normalises an uploaded video into a broadly
 * web-playable H.264 MP4 using the bundled `ffmpeg-static` binary.
 *
 * Why: guests upload phone recordings that are frequently HEVC (H.265) in a
 * `.mov` container. HEVC only decodes on browsers with OS/hardware support
 * (Safari, Chrome-on-macOS) and fails on Chrome-on-Windows, Firefox, most
 * Android, and in-app WebViews — so the video simply never renders. Converting
 * to H.264 fixes playback everywhere.
 *
 * Strategy (cheapest that works):
 *  - Already H.264 in an `.mp4` container → skip (nothing to do).
 *  - H.264 in another container (e.g. `.mov`) → remux to `.mp4` (`-c copy`,
 *    lossless, no re-encode).
 *  - Anything else (HEVC, VP9-in-mov, ...) → re-encode to H.264 / yuv420p.
 *
 * Runs on temporary files (ffmpeg can't reliably seek a piped moov atom).
 */

import { spawn } from "node:child_process";
import ffmpegStatic from "ffmpeg-static";

const ffmpegPath = ffmpegStatic;

class TranscodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscodeError";
  }
}

async function assertFfmpegPath(): Promise<string> {
  if (!ffmpegPath) {
    throw new TranscodeError(
      "ffmpeg-static did not resolve to a binary path on this platform",
    );
  }
  // When a bundler inlines `ffmpeg-static`, its baked `__dirname` can be
  // rewritten to a virtual path that doesn't exist; surface that clearly.
  const { existsSync } = await import("node:fs");
  if (!existsSync(ffmpegPath)) {
    throw new TranscodeError(
      `ffmpeg-static resolved to a path that doesn't exist on disk: ${ffmpegPath}. ` +
        `Add 'ffmpeg-static' to next.config.ts -> serverExternalPackages.`,
    );
  }
  return ffmpegPath;
}

/** Run ffmpeg; resolve with stderr on exit 0, reject with stderr otherwise. */
function runFfmpeg(binary: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve(stderr);
      else
        reject(
          new TranscodeError(
            `ffmpeg exited with code ${code}: ${stderr.trim().slice(0, 500)}`,
          ),
        );
    });
  });
}

interface ProbeResult {
  videoCodec: string | null;
  hasAudio: boolean;
}

/**
 * Detect the video codec + whether an audio track exists by parsing the
 * stream summary `ffmpeg -i` prints to stderr. `ffmpeg -i` with no output
 * file exits non-zero by design, so we read stderr regardless of exit code.
 */
async function probeVideo(
  binary: string,
  inputPath: string,
): Promise<ProbeResult> {
  const stderr = await new Promise<string>((resolve) => {
    const child = spawn(binary, ["-hide_banner", "-i", inputPath], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let s = "";
    child.stderr.on("data", (chunk: Buffer) => {
      s += chunk.toString("utf8");
    });
    child.once("error", () => resolve(s));
    child.once("close", () => resolve(s));
  });
  const match = stderr.match(/Video:\s*([a-zA-Z0-9]+)/);
  return {
    videoCodec: match ? match[1].toLowerCase() : null,
    hasAudio: /\bAudio:\s/.test(stderr),
  };
}

/**
 * Ensures the video at `inputPath` is a web-safe H.264 MP4, writing the result
 * to `outputPath` when a conversion is needed.
 *
 * Returns `true` when it wrote `outputPath` (the caller should upload/use that
 * file), or `false` when the source was already H.264/MP4 and no conversion was
 * necessary (the caller should keep using the original).
 */
export async function ensureWebSafeMp4(
  inputPath: string,
  outputPath: string,
  sourceExtension: string,
): Promise<boolean> {
  const binary = await assertFfmpegPath();
  const { videoCodec, hasAudio } = await probeVideo(binary, inputPath);

  const isH264 = videoCodec === "h264";
  const isMp4Container = sourceExtension.toLowerCase() === "mp4";

  // Already broadly playable → nothing to do.
  if (isH264 && isMp4Container) return false;

  const args = ["-y", "-loglevel", "error", "-i", inputPath];
  if (isH264) {
    // Right codec, wrong container → remux only (fast + lossless).
    args.push("-c:v", "copy");
  } else {
    // Re-encode to broadly compatible H.264.
    args.push(
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      // Cap width to 1920 to bound encode time/size on 4K sources; keep aspect
      // ratio with an even height (`-2`).
      "-vf",
      "scale='min(1920,iw)':-2",
    );
  }
  if (hasAudio) args.push("-c:a", "aac", "-b:a", "128k");
  else args.push("-an");
  args.push("-movflags", "+faststart", outputPath);

  await runFfmpeg(binary, args);
  return true;
}
