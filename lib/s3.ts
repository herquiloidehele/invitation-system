import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream, createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

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

/**
 * Returns the public S3 URL for a given key in our bucket. Used when we
 * upload server-side and want to expose the same `https://…amazonaws.com/key`
 * shape that `generatePresignedUploadUrl` produces.
 */
function publicUrlForKey(key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * If `url` lives in our bucket, returns the object key; otherwise null.
 * Accepts both the `s3.<region>.amazonaws.com` and `bucket.s3.<region>` styles
 * we actually generate.
 */
export function s3KeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const expectedHost = `${bucket}.s3.${region}.amazonaws.com`;
    if (u.host !== expectedHost) return null;
    return u.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export async function getObjectContentLength(
  key: string,
): Promise<number | null> {
  const client = getS3Client();
  const res = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key }),
  );
  return typeof res.ContentLength === "number" ? res.ContentLength : null;
}

/**
 * Downloads an S3 object's bytes into a Buffer. Used for short-lived
 * server-side processing (e.g. ffmpeg poster extraction). Avoid for very
 * large files in serverless environments — consider streaming instead.
 */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const client = getS3Client();
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!res.Body) {
    throw new Error(`S3 object ${key} returned no body`);
  }
  // The AWS SDK v3 returns the body as a web ReadableStream in Node 18+.
  const arrayBuffer = await res.Body.transformToByteArray();
  return Buffer.from(arrayBuffer);
}

export function createByteLimitTransform(maxBytes: number): {
  stream: TransformStream<Uint8Array, Uint8Array>;
  getBytesRead: () => number;
} {
  let bytesRead = 0;
  return {
    stream: new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesRead += chunk.byteLength;
        if (bytesRead > maxBytes) {
          throw new Error("S3 object exceeded the download byte limit");
        }
        controller.enqueue(chunk);
      },
    }),
    getBytesRead: () => bytesRead,
  };
}

export async function downloadObjectToFile(
  key: string,
  destinationPath: string,
  maxBytes: number,
): Promise<number> {
  const client = getS3Client();
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!res.Body) {
    throw new Error(`S3 object ${key} returned no body`);
  }

  const limiter = createByteLimitTransform(maxBytes);
  const webStream = res.Body.transformToWebStream();
  await pipeline(
    Readable.fromWeb(
      webStream.pipeThrough(
        limiter.stream,
      ) as Parameters<typeof Readable.fromWeb>[0],
    ),
    createWriteStream(destinationPath),
  );
  return limiter.getBytesRead();
}

/**
 * Uploads a Buffer to S3 with the given key + content type and returns the
 * public URL.
 */
export async function putObjectBuffer(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return publicUrlForKey(key);
}

/** Streams a local file to S3 without buffering the full asset in memory. */
export async function putObjectFile(
  key: string,
  filePath: string,
  contentType: string,
): Promise<string> {
  const client = getS3Client();
  const metadata = await stat(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentLength: metadata.size,
      ContentType: contentType,
    }),
  );
  return publicUrlForKey(key);
}

/** Deletes one object created by a failed processing attempt. */
export async function deleteObject(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  );
}
