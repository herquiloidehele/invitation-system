import { Prisma } from "@/lib/generated/prisma/client";

import { priceOverridesSchema } from "./template-price";

/**
 * Validate request `priceOverrides` and return a Prisma JSON write value.
 * Invalid or empty input is stored as JSON null (mirrors `sanitizeJsonField`).
 */
export function readPriceOverridesInput(
  input: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  const parsed = priceOverridesSchema.safeParse(input);
  return parsed.success && parsed.data
    ? (parsed.data as Prisma.InputJsonValue)
    : Prisma.JsonNull;
}
