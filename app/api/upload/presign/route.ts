import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUploadUrl } from "@/lib/s3";

// Allowed MIME types grouped by media kind
const ALLOWED_TYPES: Record<string, "images" | "videos" | "audio"> = {
  // Images
  "image/jpeg": "images",
  "image/jpg": "images",
  "image/png": "images",
  "image/webp": "images",
  "image/gif": "images",
  "image/avif": "images",
  // Videos
  "video/mp4": "videos",
  "video/webm": "videos",
  "video/ogg": "videos",
  "video/quicktime": "videos",
  "video/x-msvideo": "videos",
  // Audio
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/ogg": "audio",
  "audio/wav": "audio",
  "audio/webm": "audio",
  "audio/aac": "audio",
  "audio/flac": "audio",
};

// Max file sizes in bytes
const MAX_SIZES: Record<"images" | "videos" | "audio", number> = {
  images: 5 * 1024 * 1024, //   5 MB
  videos: 100 * 1024 * 1024, // 100 MB
  audio: 20 * 1024 * 1024, //  20 MB
};

export async function POST(req: NextRequest) {
  try {
    // Validate AWS environment variables are configured
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.AWS_REGION ||
      !process.env.S3_BUCKET_NAME
    ) {
      return NextResponse.json(
        {
          error:
            "S3 storage is not configured. Set AWS_* environment variables.",
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { fileName, fileType, fileSize } = body as {
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    };

    // Validate presence
    if (!fileName || !fileType || fileSize === undefined) {
      return NextResponse.json(
        { error: "fileName, fileType and fileSize are required." },
        { status: 400 },
      );
    }

    // Validate file type
    const folder = ALLOWED_TYPES[fileType];
    if (!folder) {
      return NextResponse.json(
        { error: `File type "${fileType}" is not allowed.` },
        { status: 400 },
      );
    }

    // Validate file size
    const maxSize = MAX_SIZES[folder];
    if (fileSize > maxSize) {
      const mb = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        { error: `File exceeds the ${mb} MB limit for ${folder}.` },
        { status: 413 },
      );
    }

    const result = await generatePresignedUploadUrl(fileName, fileType, folder);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[/api/upload/presign]", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL." },
      { status: 500 },
    );
  }
}
