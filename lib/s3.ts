import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION!;
const bucket = process.env.S3_BUCKET_NAME!;

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED"
    });
  }
  return _client;
}

export interface PresignedUploadResult {
  presignedUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Generates a presigned PUT URL so the browser can upload directly to S3.
 * The key is structured as: uploads/{folder}/{timestamp}-{sanitized-filename}
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  folder: "images" | "videos" | "audio",
  expiresIn = 600, // 10 minutes
): Promise<PresignedUploadResult> {
  const client = getS3Client();

  // Sanitize filename: strip special chars, keep extension
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  const key = `uploads/${folder}/${Date.now()}-${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(client, command, { expiresIn });

  // Construct the public URL (works for public buckets or via CloudFront)
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { presignedUrl, publicUrl, key };
}
