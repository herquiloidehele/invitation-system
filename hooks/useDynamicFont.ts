"use client";

import { useEffect, useRef } from "react";

import {
  buildCustomFontFaceCss,
  extractCustomFontFamilyId,
} from "@/lib/custom-fonts/domain";
import type { CustomFontManifest } from "@/lib/custom-fonts/types";
import { BUILTIN_FONT_FAMILIES, buildGoogleFontUrl } from "@/lib/google-fonts";

const builtinSet = new Set(BUILTIN_FONT_FAMILIES.map((font) => font.toLowerCase()));

type ClassifiedFont =
  | { source: "builtin"; family: string }
  | { source: "google"; family: string }
  | { source: "custom"; family: string; id: string };

function normalize(family: string): string {
  return family
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

export function classifyFontFamily(stack: string): ClassifiedFont {
  const family = normalize(stack);
  const id = extractCustomFontFamilyId(stack);
  if (id) return { source: "custom", family, id };
  return builtinSet.has(family.toLowerCase())
    ? { source: "builtin", family }
    : { source: "google", family };
}

export function uniqueCustomFontIds(stacks: readonly string[]): string[] {
  const ids = new Set<string>();
  for (const stack of stacks) {
    const classified = classifyFontFamily(stack);
    if (classified.source === "custom") ids.add(classified.id);
  }
  return [...ids];
}

export function customFontLoadKey(manifest: CustomFontManifest): string {
  return [
    manifest.id,
    manifest.revision,
    ...manifest.variants.map(
      (variant) =>
        `${variant.id}:${variant.revision}:${variant.weight}:${variant.style}:${variant.format}`,
    ),
  ].join("|");
}

const googleRefCounts = new Map<string, number>();
const googleLinks = new Map<string, HTMLLinkElement>();

type CustomLoadState = {
  refs: number;
  generation: number;
  loadKey?: string;
  promise?: Promise<void>;
  style?: HTMLStyleElement;
};

const customLoads = new Map<string, CustomLoadState>();
const manifestCache = new Map<string, CustomFontManifest>();

function acquireGoogleFont(family: string, weights?: number[]) {
  const current = googleRefCounts.get(family) ?? 0;
  googleRefCounts.set(family, current + 1);
  if (current > 0) return;

  const linkId = `dynamic-font-${family.replace(/\s+/g, "-").toLowerCase()}`;
  const existing = document.getElementById(linkId) as HTMLLinkElement | null;
  if (existing) {
    googleLinks.set(family, existing);
    return;
  }
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = buildGoogleFontUrl(family, weights);
  document.head.appendChild(link);
  googleLinks.set(family, link);
}

function releaseGoogleFont(family: string) {
  const current = googleRefCounts.get(family) ?? 0;
  if (current <= 1) {
    googleRefCounts.delete(family);
    googleLinks.get(family)?.remove();
    googleLinks.delete(family);
    return;
  }
  googleRefCounts.set(family, current - 1);
}

function customState(id: string): CustomLoadState {
  const current = customLoads.get(id);
  if (current) return current;
  const created: CustomLoadState = { refs: 0, generation: 0 };
  customLoads.set(id, created);
  return created;
}

async function fetchCustomManifest(id: string): Promise<CustomFontManifest> {
  const cached = manifestCache.get(id);
  if (cached) return cached;
  const response = await fetch(`/api/fonts/families/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Custom font manifest returned ${response.status}`);
  }
  const manifest = (await response.json()) as CustomFontManifest;
  manifestCache.set(id, manifest);
  return manifest;
}

function ensureCustomFont(id: string): Promise<void> {
  const state = customState(id);
  if (state.promise) return state.promise;
  const generation = state.generation;
  const promise = (async () => {
    try {
      const manifest = await fetchCustomManifest(id);
      if (state.refs <= 0 || state.generation !== generation) return;
      const loadKey = customFontLoadKey(manifest);
      if (state.style && state.loadKey === loadKey) return;
      const style = document.createElement("style");
      style.id = `custom-font-style-${id}`;
      style.textContent = buildCustomFontFaceCss(manifest);
      state.style?.remove();
      document.head.appendChild(style);
      state.style = style;
      state.loadKey = loadKey;
    } catch (error) {
      console.error(`[custom-fonts] Failed to load family ${id}`, error);
    }
  })();
  state.promise = promise;
  void promise.finally(() => {
    if (state.promise === promise) state.promise = undefined;
  });
  return promise;
}

function acquireFont(stack: string, weights?: number[]) {
  const classified = classifyFontFamily(stack);
  if (!classified.family || classified.source === "builtin") return;
  if (classified.source === "google") {
    acquireGoogleFont(classified.family, weights);
    return;
  }
  const state = customState(classified.id);
  state.refs += 1;
  void ensureCustomFont(classified.id);
}

function releaseFont(stack: string) {
  const classified = classifyFontFamily(stack);
  if (!classified.family || classified.source === "builtin") return;
  if (classified.source === "google") {
    releaseGoogleFont(classified.family);
    return;
  }
  const state = customState(classified.id);
  state.refs = Math.max(0, state.refs - 1);
  if (state.refs === 0) {
    state.style?.remove();
    state.style = undefined;
    state.loadKey = undefined;
  }
}

export function invalidateCustomFontManifest(id: string): void {
  manifestCache.delete(id);
  const state = customState(id);
  state.generation += 1;
  state.promise = undefined;
  state.style?.remove();
  state.style = undefined;
  state.loadKey = undefined;
  if (state.refs > 0) void ensureCustomFont(id);
}

export function useDynamicFont(
  family: string | undefined | null,
  weights?: number[],
) {
  const acquiredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!family || !normalize(family)) return;
    acquireFont(family, weights);
    acquiredRef.current = family;
    return () => {
      if (acquiredRef.current) releaseFont(acquiredRef.current);
      acquiredRef.current = null;
    };
  }, [family, weights]);
}

export function useDynamicFonts(families: (string | undefined | null)[]) {
  const normalizedFamilies = [...new Set(families.filter((font): font is string => !!font))];
  const familiesKey = normalizedFamilies.join("|");
  const acquiredRef = useRef<string[]>([]);

  useEffect(() => {
    for (const family of normalizedFamilies) acquireFont(family);
    acquiredRef.current = normalizedFamilies;
    return () => {
      for (const family of acquiredRef.current) releaseFont(family);
      acquiredRef.current = [];
    };
    // The stable key deliberately owns this deduplicated list lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familiesKey]);
}
