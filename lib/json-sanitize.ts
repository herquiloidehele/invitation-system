import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Reject empty strings for JSON columns — they cause `JSON.parse("")`
 * failures in the pg adapter. Returns `Prisma.JsonNull` for nullable
 * columns when the fallback is null, which satisfies Prisma's type system.
 *
 * - For nullable JSON columns, pass `null` as the fallback.
 * - For non-nullable JSON columns on UPDATE, pass the existing DB value as fallback.
 * - For non-nullable JSON columns on CREATE, pass the default object/array.
 */
export function sanitizeJsonField(
  value: unknown,
  fallback: Prisma.InputJsonValue | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return fallback === null
      ? Prisma.JsonNull
      : (fallback as Prisma.InputJsonValue);
  }
  return value as Prisma.InputJsonValue;
}
