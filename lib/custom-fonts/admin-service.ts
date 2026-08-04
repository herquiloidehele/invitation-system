import { randomUUID } from "node:crypto";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  buildCustomFontCssFamily,
  buildCustomFontStack,
  normalizeCustomFontName,
} from "./domain";
import {
  cleanupFontObject,
  copyPendingFontToPermanent,
  deletePendingFont,
  readFontObject,
} from "./storage";
import type {
  AdminCustomFontFamily,
  AdminCustomFontVariant,
  CustomFontStyle,
  FontCategory,
} from "./types";
import {
  findCustomFontUsages,
  type CustomFontUsage,
} from "./usage";

const FONT_CATEGORIES = new Set<FontCategory>([
  "serif",
  "sans-serif",
  "display",
  "handwriting",
  "monospace",
]);
const FONT_STYLES = new Set<CustomFontStyle>(["normal", "italic"]);

type FamilyWithVariants = Prisma.CustomFontFamilyGetPayload<{
  include: { variants: true };
}>;

export class CustomFontServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CustomFontServiceError";
  }

  get usages(): CustomFontUsage[] | undefined {
    return this.details?.usages as CustomFontUsage[] | undefined;
  }
}

export interface CommitVariantInput {
  pendingKey: string;
  weight: number;
  style: CustomFontStyle;
  replace: boolean;
  expectedChecksum: string;
  originalFileName: string;
}

export interface CreateCustomFontFamilyInput extends CommitVariantInput {
  name: string;
  fallbackCategory: FontCategory;
}

export interface UpdateCustomFontFamilyInput {
  name?: string;
  fallbackCategory?: FontCategory;
  archived?: boolean;
}

export interface CustomFontListQuery {
  search?: string;
  archived?: "active" | "archived" | "all";
  page?: number;
  limit?: number;
}

function cleanDisplayName(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    throw new CustomFontServiceError(
      "invalid_input",
      "Font family name is required",
    );
  }
  return cleaned;
}

function validateCategory(category: FontCategory): void {
  if (!FONT_CATEGORIES.has(category)) {
    throw new CustomFontServiceError(
      "invalid_input",
      "Unsupported font category",
    );
  }
}

function validateVariantInput(input: CommitVariantInput): void {
  if (!Number.isInteger(input.weight) || input.weight < 100 || input.weight > 900) {
    throw new CustomFontServiceError(
      "invalid_input",
      "Font weight must be an integer from 100 to 900",
    );
  }
  if (!FONT_STYLES.has(input.style)) {
    throw new CustomFontServiceError(
      "invalid_input",
      "Font style must be normal or italic",
    );
  }
  if (!input.expectedChecksum) {
    throw new CustomFontServiceError(
      "invalid_input",
      "Expected checksum is required",
    );
  }
}

function safeOriginalFileName(name: string): string {
  return name.split(/[\\/]/).pop()?.slice(0, 255) || "font-file";
}

function metadataRecord(value: Prisma.JsonValue): Record<string, string | number | null> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value as Record<string, string | number | null>;
}

function toAdminVariant(variant: FamilyWithVariants["variants"][number]): AdminCustomFontVariant {
  return {
    id: variant.id,
    weight: variant.weight,
    style: variant.style as CustomFontStyle,
    format: variant.format as AdminCustomFontVariant["format"],
    revision: variant.revision,
    url: `/api/fonts/files/${variant.id}?v=${variant.revision}`,
    originalFileName: variant.originalFileName,
    mimeType: variant.mimeType,
    sizeBytes: variant.sizeBytes,
    checksum: variant.checksum,
    metadata: metadataRecord(variant.metadata),
  };
}

export function toAdminCustomFontFamily(
  family: FamilyWithVariants,
): AdminCustomFontFamily {
  const category = family.fallbackCategory as FontCategory;
  return {
    id: family.id,
    family: family.name,
    cssFamily: family.cssFamily,
    category,
    value: buildCustomFontStack(family.id, category),
    revision: family.revision,
    archived: family.archivedAt !== null,
    variants: [...family.variants]
      .sort(
        (left, right) =>
          left.weight - right.weight || left.style.localeCompare(right.style),
      )
      .map(toAdminVariant),
  };
}

function mapPersistenceError(error: unknown): never {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  ) {
    throw new CustomFontServiceError(
      "duplicate_family",
      "A custom font family with this name already exists",
    );
  }
  throw error;
}

async function cleanPendingAfterCommit(pendingKey: string): Promise<void> {
  try {
    await deletePendingFont(pendingKey);
  } catch (error) {
    console.error(
      `[custom-fonts] Failed to clean pending S3 object ${pendingKey}`,
      error,
    );
  }
}

async function validatePendingVariant(input: CommitVariantInput) {
  validateVariantInput(input);
  const { analysis } = await readFontObject(input.pendingKey);
  if (analysis.checksum !== input.expectedChecksum) {
    throw new CustomFontServiceError(
      "upload_changed",
      "Pending font contents changed after analysis",
    );
  }
  return analysis;
}

export async function analyzePendingFont(pendingKey: string) {
  return (await readFontObject(pendingKey)).analysis;
}

export async function listCustomFontFamilies(query: CustomFontListQuery = {}) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 50));
  const archived = query.archived ?? "active";
  const where: Prisma.CustomFontFamilyWhereInput = {
    ...(query.search?.trim()
      ? {
          normalizedName: {
            contains: normalizeCustomFontName(query.search),
            mode: "insensitive",
          },
        }
      : {}),
    ...(archived === "active"
      ? { archivedAt: null }
      : archived === "archived"
        ? { archivedAt: { not: null } }
        : {}),
  };
  const [families, total] = await Promise.all([
    prisma.customFontFamily.findMany({
      where,
      include: { variants: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customFontFamily.count({ where }),
  ]);
  return {
    families: families.map(toAdminCustomFontFamily),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getCustomFontFamily(
  id: string,
): Promise<AdminCustomFontFamily> {
  const family = await prisma.customFontFamily.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!family) {
    throw new CustomFontServiceError("not_found", "Custom font family not found");
  }
  return toAdminCustomFontFamily(family);
}

export async function createCustomFontFamily(
  input: CreateCustomFontFamilyInput,
): Promise<AdminCustomFontFamily> {
  const name = cleanDisplayName(input.name);
  validateCategory(input.fallbackCategory);
  const analysis = await validatePendingVariant(input);
  const familyId = randomUUID();
  const objectKey = await copyPendingFontToPermanent({
    pendingKey: input.pendingKey,
    familyId,
    format: analysis.format,
    mimeType: analysis.mimeType,
  });

  let family: FamilyWithVariants;
  try {
    family = await prisma.$transaction((tx) =>
      tx.customFontFamily.create({
        data: {
          id: familyId,
          name,
          normalizedName: normalizeCustomFontName(name),
          cssFamily: buildCustomFontCssFamily(familyId),
          fallbackCategory: input.fallbackCategory,
          variants: {
            create: {
              weight: input.weight,
              style: input.style,
              format: analysis.format,
              objectKey,
              originalFileName: safeOriginalFileName(input.originalFileName),
              mimeType: analysis.mimeType,
              sizeBytes: analysis.sizeBytes,
              checksum: analysis.checksum,
              metadata: analysis.metadata,
            },
          },
        },
        include: { variants: true },
      }),
    );
  } catch (error) {
    await cleanupFontObject(objectKey);
    mapPersistenceError(error);
  }

  await cleanPendingAfterCommit(input.pendingKey);
  return toAdminCustomFontFamily(family!);
}

export async function addCustomFontVariant(
  familyId: string,
  input: CommitVariantInput,
): Promise<AdminCustomFontFamily> {
  validateVariantInput(input);
  const current = await prisma.customFontFamily.findUnique({
    where: { id: familyId },
    include: { variants: true },
  });
  if (!current) {
    throw new CustomFontServiceError("not_found", "Custom font family not found");
  }
  const occupied = current.variants.find(
    (variant) =>
      variant.weight === input.weight && variant.style === input.style,
  );
  if (occupied && !input.replace) {
    throw new CustomFontServiceError(
      "replacement_required",
      "This weight and style already exists",
      { variant: toAdminVariant(occupied) },
    );
  }

  const analysis = await validatePendingVariant(input);
  const objectKey = await copyPendingFontToPermanent({
    pendingKey: input.pendingKey,
    familyId,
    format: analysis.format,
    mimeType: analysis.mimeType,
  });

  let next: FamilyWithVariants;
  try {
    next = await prisma.$transaction(async (tx) => {
      const variantData = {
        weight: input.weight,
        style: input.style,
        format: analysis.format,
        objectKey,
        originalFileName: safeOriginalFileName(input.originalFileName),
        mimeType: analysis.mimeType,
        sizeBytes: analysis.sizeBytes,
        checksum: analysis.checksum,
        metadata: analysis.metadata,
      };
      const variant = occupied
        ? await tx.customFontVariant.update({
            where: { id: occupied.id },
            data: { ...variantData, revision: { increment: 1 } },
          })
        : await tx.customFontVariant.create({
            data: { familyId, ...variantData },
          });
      const updatedFamily = await tx.customFontFamily.update({
        where: { id: familyId },
        data: { revision: { increment: 1 } },
      });
      return {
        ...updatedFamily,
        variants: occupied
          ? current.variants.map((item) =>
              item.id === occupied.id ? variant : item,
            )
          : [...current.variants, variant],
      };
    });
  } catch (error) {
    await cleanupFontObject(objectKey);
    mapPersistenceError(error);
  }

  await cleanPendingAfterCommit(input.pendingKey);
  if (occupied) await cleanupFontObject(occupied.objectKey);
  return toAdminCustomFontFamily(next!);
}

export async function updateCustomFontFamily(
  id: string,
  input: UpdateCustomFontFamilyInput,
): Promise<AdminCustomFontFamily> {
  if (
    input.name === undefined &&
    input.fallbackCategory === undefined &&
    input.archived === undefined
  ) {
    throw new CustomFontServiceError("invalid_input", "No changes supplied");
  }
  const data: Prisma.CustomFontFamilyUpdateInput = {};
  if (input.name !== undefined) {
    const name = cleanDisplayName(input.name);
    data.name = name;
    data.normalizedName = normalizeCustomFontName(name);
    data.revision = { increment: 1 };
  }
  if (input.fallbackCategory !== undefined) {
    validateCategory(input.fallbackCategory);
    data.fallbackCategory = input.fallbackCategory;
    data.revision = { increment: 1 };
  }
  if (input.archived !== undefined) {
    data.archivedAt = input.archived ? new Date() : null;
  }
  try {
    const family = await prisma.customFontFamily.update({
      where: { id },
      data,
      include: { variants: true },
    });
    return toAdminCustomFontFamily(family);
  } catch (error) {
    mapPersistenceError(error);
  }
}

export async function deleteCustomFontFamily(id: string): Promise<void> {
  const family = await prisma.customFontFamily.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!family) {
    throw new CustomFontServiceError("not_found", "Custom font family not found");
  }
  const usages = await findCustomFontUsages(family.cssFamily);
  if (usages.length > 0) {
    throw new CustomFontServiceError(
      "font_in_use",
      "Custom font family is still in use",
      { usages },
    );
  }
  await prisma.$transaction((tx) =>
    tx.customFontFamily.delete({ where: { id } }),
  );
  await Promise.all(
    family.variants.map((variant) => cleanupFontObject(variant.objectKey)),
  );
}
