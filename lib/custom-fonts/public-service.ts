import { prisma } from "@/lib/db";
import { getObjectStream } from "@/lib/s3";
import type {
  CustomFontFormat,
  CustomFontManifest,
  CustomFontStyle,
  FontCategory,
} from "./types";

export async function getCustomFontManifest(
  id: string,
): Promise<CustomFontManifest | null> {
  const family = await prisma.customFontFamily.findUnique({
    where: { id },
    select: {
      id: true,
      cssFamily: true,
      fallbackCategory: true,
      revision: true,
      variants: {
        select: {
          id: true,
          weight: true,
          style: true,
          format: true,
          revision: true,
        },
        orderBy: [{ weight: "asc" }, { style: "asc" }],
      },
    },
  });
  if (!family) return null;
  return {
    id: family.id,
    cssFamily: family.cssFamily,
    fallbackCategory: family.fallbackCategory as FontCategory,
    revision: family.revision,
    variants: family.variants.map((variant) => ({
      id: variant.id,
      weight: variant.weight,
      style: variant.style as CustomFontStyle,
      format: variant.format as CustomFontFormat,
      revision: variant.revision,
      url: `/api/fonts/files/${variant.id}?v=${variant.revision}`,
    })),
  };
}

export async function getCustomFontFile(variantId: string) {
  const variant = await prisma.customFontVariant.findUnique({
    where: { id: variantId },
    select: { objectKey: true, mimeType: true, sizeBytes: true },
  });
  if (!variant) return null;
  return {
    ...variant,
    stream: await getObjectStream(variant.objectKey),
  };
}
