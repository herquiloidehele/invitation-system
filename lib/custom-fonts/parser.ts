import { createHash } from "node:crypto";
import * as fontkit from "fontkit";
import type { Font, FontCollection } from "fontkit";

import { detectFontFormat, fontMimeType } from "./domain";
import type { CustomFontAnalysis, CustomFontStyle } from "./types";

interface ParsedMetadataInput {
  familyName?: string | null;
  subfamilyName?: string | null;
  postscriptName?: string | null;
  weightClass?: number | null;
  italicAngle?: number | null;
}

function isFontCollection(
  parsed: Font | FontCollection,
): parsed is FontCollection {
  return parsed.type === "TTC" || parsed.type === "DFont";
}

export function normalizeParsedMetadata(input: ParsedMetadataInput): {
  familyName: string;
  weight: number;
  style: CustomFontStyle;
} {
  const familyName = input.familyName?.trim().replace(/\s+/g, " ") ?? "";
  if (!familyName) {
    throw new Error("Font family metadata is missing");
  }
  const weight =
    input.weightClass &&
    input.weightClass >= 100 &&
    input.weightClass <= 900
      ? Math.round(input.weightClass)
      : 400;
  const style: CustomFontStyle =
    (input.italicAngle ?? 0) !== 0 ||
    /italic|oblique/i.test(input.subfamilyName ?? "")
      ? "italic"
      : "normal";
  return { familyName, weight, style };
}

export function analyzeFontBuffer(buffer: Buffer): CustomFontAnalysis {
  const format = detectFontFormat(buffer);
  const parsed = fontkit.create(buffer);
  if (isFontCollection(parsed)) {
    throw new Error("Font collections are not supported");
  }
  const normalized = normalizeParsedMetadata({
    familyName: parsed.familyName,
    subfamilyName: parsed.subfamilyName,
    postscriptName: parsed.postscriptName,
    weightClass: parsed["OS/2"]?.usWeightClass,
    italicAngle: parsed.italicAngle,
  });

  return {
    ...normalized,
    format,
    mimeType: fontMimeType(format),
    sizeBytes: buffer.byteLength,
    checksum: createHash("sha256").update(buffer).digest("hex"),
    metadata: {
      fullName: parsed.fullName,
      postscriptName: parsed.postscriptName,
      subfamilyName: parsed.subfamilyName,
      unitsPerEm: parsed.unitsPerEm,
      glyphCount: parsed.numGlyphs,
    },
  };
}
