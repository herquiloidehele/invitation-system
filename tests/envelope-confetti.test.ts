import { describe, expect, it } from "vitest";

import {
  getDefaultConfettiColors,
  resolveEnvelopeConfettiColors,
} from "../lib/confetti";
import type { EnvelopeConfig, TemplateTheme } from "../lib/types";

// Minimal theme stub — only the color fields the helper reads.
const theme = {
  accent: "#AA0000",
  monogramColor: "#00AA00",
  textPrimary: "#0000AA",
} as unknown as TemplateTheme;

describe("getDefaultConfettiColors", () => {
  it("derives a palette from the theme accent/monogram/text + white", () => {
    expect(getDefaultConfettiColors(theme)).toEqual([
      "#AA0000",
      "#00AA00",
      "#0000AA",
      "#ffffff",
    ]);
  });

  it("falls back to accent when monogramColor is empty", () => {
    const t = { ...theme, monogramColor: "" } as unknown as TemplateTheme;
    expect(getDefaultConfettiColors(t)).toEqual([
      "#AA0000",
      "#AA0000",
      "#0000AA",
      "#ffffff",
    ]);
  });
});

describe("resolveEnvelopeConfettiColors", () => {
  it("returns null when envelope is undefined", () => {
    expect(resolveEnvelopeConfettiColors(undefined, theme)).toBeNull();
  });

  it("returns null when confetti is absent (default off)", () => {
    const env: EnvelopeConfig = { shimmer: true };
    expect(resolveEnvelopeConfettiColors(env, theme)).toBeNull();
  });

  it("returns null when explicitly disabled", () => {
    const env: EnvelopeConfig = { confetti: { enabled: false } };
    expect(resolveEnvelopeConfettiColors(env, theme)).toBeNull();
  });

  it("returns theme defaults when enabled with no custom colors", () => {
    const env: EnvelopeConfig = { confetti: { enabled: true } };
    expect(resolveEnvelopeConfettiColors(env, theme)).toEqual([
      "#AA0000",
      "#00AA00",
      "#0000AA",
      "#ffffff",
    ]);
  });

  it("returns theme defaults when enabled with an empty colors array", () => {
    const env: EnvelopeConfig = { confetti: { enabled: true, colors: [] } };
    expect(resolveEnvelopeConfettiColors(env, theme)).toEqual([
      "#AA0000",
      "#00AA00",
      "#0000AA",
      "#ffffff",
    ]);
  });

  it("returns the custom colors when provided", () => {
    const env: EnvelopeConfig = {
      confetti: { enabled: true, colors: ["#111", "#222"] },
    };
    expect(resolveEnvelopeConfettiColors(env, theme)).toEqual(["#111", "#222"]);
  });
});
