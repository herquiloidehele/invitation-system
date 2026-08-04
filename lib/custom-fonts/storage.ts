import { randomUUID } from "node:crypto";

import {
  copyObject,
  deleteObject,
  getObjectBufferLimited,
} from "@/lib/s3";
import { analyzeFontBuffer } from "./parser";
import type { CustomFontAnalysis, CustomFontFormat } from "./types";

export const FONT_MAX_BYTES = 10 * 1024 * 1024;
const PENDING_PREFIX = "uploads/fonts/pending/";

export function isPendingFontKey(key: unknown): key is string {
  if (typeof key !== "string" || !key.startsWith(PENDING_PREFIX)) return false;
  const name = key.slice(PENDING_PREFIX.length);
  return (
    name.length > 0 &&
    !name.includes("/") &&
    !name.includes("..") &&
    /^[a-zA-Z0-9._-]+$/.test(name)
  );
}

export function buildPermanentFontKey(
  familyId: string,
  format: CustomFontFormat,
  objectId: string = randomUUID(),
): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(familyId)) {
    throw new Error("Invalid custom font family id");
  }
  return `uploads/fonts/${familyId}/${objectId}.${format}`;
}

export async function readFontObject(
  pendingKey: string,
): Promise<{ buffer: Buffer; analysis: CustomFontAnalysis }> {
  if (!isPendingFontKey(pendingKey)) {
    throw new Error("Invalid pending font key");
  }
  const buffer = await getObjectBufferLimited(pendingKey, FONT_MAX_BYTES);
  return { buffer, analysis: analyzeFontBuffer(buffer) };
}

export async function copyPendingFontToPermanent(input: {
  pendingKey: string;
  familyId: string;
  format: CustomFontFormat;
  mimeType: string;
}): Promise<string> {
  if (!isPendingFontKey(input.pendingKey)) {
    throw new Error("Invalid pending font key");
  }
  const destinationKey = buildPermanentFontKey(input.familyId, input.format);
  await copyObject(input.pendingKey, destinationKey, input.mimeType);
  return destinationKey;
}

export async function deletePendingFont(pendingKey: string): Promise<void> {
  if (!isPendingFontKey(pendingKey)) return;
  await deleteObject(pendingKey);
}

export async function cleanupFontObject(key: string): Promise<void> {
  try {
    await deleteObject(key);
  } catch (error) {
    console.error(`[custom-fonts] Failed to clean S3 object ${key}`, error);
  }
}
