import type { EnvelopeConfig } from "./types";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export interface BrowserUiColorInput {
  envelope: EnvelopeConfig | null | undefined;
  themeEnvelopeBase?: string | null;
  pageBackground?: string | null;
}

export function isBrowserUiHexColor(
  value: string | null | undefined,
): value is string {
  return HEX_COLOR_RE.test(value ?? "");
}

export function resolveBrowserUiColor({
  envelope,
  themeEnvelopeBase,
  pageBackground,
}: BrowserUiColorInput): string | undefined {
  const candidates = [
    envelope?.browserUiColor,
    envelope?.coverBackground,
    envelope?.base,
    themeEnvelopeBase,
    pageBackground,
  ];

  return candidates.find(isBrowserUiHexColor);
}
