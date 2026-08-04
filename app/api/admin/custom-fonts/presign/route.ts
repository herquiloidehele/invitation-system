import { NextResponse } from "next/server";

import { FONT_MAX_BYTES } from "@/lib/custom-fonts/storage";
import { generatePresignedUploadUrl } from "@/lib/s3";

const FONT_MIME_TYPES = new Set([
  "font/woff2",
  "font/woff",
  "font/ttf",
  "font/otf",
  "application/font-woff",
  "application/x-font-ttf",
  "application/x-font-opentype",
  "application/octet-stream",
]);
const FONT_FILE_PATTERN = /\.(woff2|woff|ttf|otf)$/i;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fileName = typeof body.fileName === "string" ? body.fileName : "";
    const fileType = typeof body.fileType === "string" ? body.fileType : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : NaN;
    if (!fileName || !FONT_FILE_PATTERN.test(fileName) || !FONT_MIME_TYPES.has(fileType)) {
      return NextResponse.json(
        { error: "Unsupported font file", code: "invalid_input" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json(
        { error: "Invalid font file size", code: "invalid_input" },
        { status: 400 },
      );
    }
    if (fileSize > FONT_MAX_BYTES) {
      return NextResponse.json(
        { error: "Font file exceeds the 10 MB limit", code: "file_too_large" },
        { status: 413 },
      );
    }
    const result = await generatePresignedUploadUrl(
      fileName,
      fileType,
      "fonts/pending",
    );
    return NextResponse.json({
      presignedUrl: result.presignedUrl,
      pendingKey: result.key,
    });
  } catch (error) {
    console.error("[custom-fonts/presign]", error);
    return NextResponse.json(
      { error: "Failed to prepare font upload", code: "internal_error" },
      { status: 500 },
    );
  }
}
