export type FontCategory =
  | "serif"
  | "sans-serif"
  | "display"
  | "handwriting"
  | "monospace";

export type CustomFontFormat = "woff2" | "woff" | "ttf" | "otf";
export type CustomFontStyle = "normal" | "italic";

export interface CustomFontManifestVariant {
  id: string;
  weight: number;
  style: CustomFontStyle;
  format: CustomFontFormat;
  revision: number;
  url: string;
}

export interface CustomFontManifest {
  id: string;
  cssFamily: string;
  fallbackCategory: FontCategory;
  revision: number;
  variants: CustomFontManifestVariant[];
}

export interface CustomFontAnalysis {
  familyName: string;
  weight: number;
  style: CustomFontStyle;
  format: CustomFontFormat;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  metadata: Record<string, string | number | null>;
}

export interface AdminCustomFontVariant extends CustomFontManifestVariant {
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  metadata: Record<string, string | number | null>;
}

export interface AdminCustomFontFamily {
  id: string;
  family: string;
  cssFamily: string;
  category: FontCategory;
  value: string;
  revision: number;
  archived: boolean;
  variants: AdminCustomFontVariant[];
}

export type FontCatalogEntry =
  | {
      source: "builtin" | "google";
      family: string;
      category: FontCategory;
      value: string;
      builtin: boolean;
    }
  | {
      source: "custom";
      id: string;
      family: string;
      category: FontCategory;
      value: string;
      archived: boolean;
      variants: Array<{ weight: number; style: CustomFontStyle }>;
    };
