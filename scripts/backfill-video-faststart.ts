/**
 * One-off maintenance sweep: rewrite every already-uploaded MP4 whose `moov`
 * atom trails its media data so that `moov` comes first ("faststart").
 *
 * Why: browsers cannot begin playback from the leading bytes of a moov-at-end
 * MP4. Chrome aborts its first request, range-reads the tail to find `moov`,
 * then re-requests the body it abandoned — three network requests per clip and
 * two extra round trips before the first frame. `lib/video-transcode.ts` now
 * prevents this at upload time; this script fixes files uploaded before that.
 *
 * The rewrite is a container-level remux (`-c copy`): no re-encode, no quality
 * change, near-instant. Each fixed file is written back to the SAME S3 key, so
 * every stored URL keeps working and no database rows need touching.
 *
 * Usage (read-only unless `--apply` is passed):
 *   npx tsx --env-file=.env.development scripts/backfill-video-faststart.ts
 *   npx tsx --env-file=.env.production  scripts/backfill-video-faststart.ts --apply
 */

import { execFile } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegStatic from "ffmpeg-static";

import { isFaststartMp4, MP4_FASTSTART_PROBE_BYTES } from "@/lib/mp4-faststart";
import {
  downloadObjectToFile,
  getObjectHead,
  listObjectKeys,
  putObjectFile,
} from "@/lib/s3";

const execFileAsync = promisify(execFile);

const VIDEO_PREFIX = "uploads/videos/";
/** Skip anything implausibly large rather than stall the sweep on it. */
const MAX_REWRITE_BYTES = 500 * 1024 * 1024;

const apply = process.argv.includes("--apply");

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  const ffmpeg = ffmpegStatic;
  if (!ffmpeg) throw new Error("ffmpeg-static did not resolve on this platform");

  const keys = (await listObjectKeys(VIDEO_PREFIX)).filter((key) =>
    key.toLowerCase().endsWith(".mp4"),
  );
  console.log(
    `${keys.length} MP4 object(s) under ${VIDEO_PREFIX}` +
      `${apply ? "" : " — dry run, pass --apply to rewrite"}\n`,
  );

  // Probe headers only: one small ranged GET per object, never a full download.
  const needsFix: string[] = [];
  for (const key of keys) {
    const head = await getObjectHead(key, MP4_FASTSTART_PROBE_BYTES).catch(
      () => null,
    );
    if (!head) {
      console.log(`?  ${key} — could not read head, skipped`);
      continue;
    }
    if (isFaststartMp4(head)) continue;
    needsFix.push(key);
    console.log(`✗  ${key}`);
  }

  console.log(
    `\n${needsFix.length} of ${keys.length} need faststart` +
      `${needsFix.length && !apply ? " — re-run with --apply to fix" : ""}`,
  );
  if (!apply || needsFix.length === 0) return;

  const workDir = await mkdtemp(path.join(os.tmpdir(), "faststart-"));
  let fixed = 0;
  try {
    for (const key of needsFix) {
      const input = path.join(workDir, "in.mp4");
      const output = path.join(workDir, "out.mp4");
      try {
        await downloadObjectToFile(key, input, MAX_REWRITE_BYTES);
        await execFileAsync(ffmpeg, [
          "-y",
          "-loglevel",
          "error",
          "-i",
          input,
          "-c",
          "copy",
          "-movflags",
          "+faststart",
          output,
        ]);
        const before = (await stat(input)).size;
        const after = (await stat(output)).size;
        await putObjectFile(key, output, "video/mp4");
        fixed += 1;
        console.log(`✓  ${key} (${mb(before)} → ${mb(after)})`);
      } catch (err) {
        // Leave the original object untouched and keep going.
        console.error(
          `!  ${key} — ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        await rm(input, { force: true });
        await rm(output, { force: true });
      }
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
  console.log(`\nRewrote ${fixed} of ${needsFix.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
