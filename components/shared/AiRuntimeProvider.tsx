"use client";

import * as React from "react";
import * as JsxRuntime from "react/jsx-runtime";
import * as FramerMotion from "framer-motion";

import { createBundleRegistry } from "@/lib/ai-bundle-registry";
import { AI_RUNTIME_KEY, type AiRuntime } from "@/lib/ai-runtime";
import { buildPlatformApi } from "./ai/buildPlatformApi";

/**
 * Installs the host runtime before any bundle script is injected. Idempotent:
 * the bundle registry must survive remounts, or a bundle that already executed
 * would never be found again (scripts do not re-run for a cached URL).
 */
function ensureRuntime(): AiRuntime {
  const globals = globalThis as Record<string, unknown>;
  const existing = globals[AI_RUNTIME_KEY] as AiRuntime | undefined;
  if (existing) return existing;

  const runtime: AiRuntime = {
    react: React,
    jsxRuntime: JsxRuntime,
    framerMotion: FramerMotion,
    platform: buildPlatformApi(),
    bundles: createBundleRegistry(),
  };
  globals[AI_RUNTIME_KEY] = runtime;
  return runtime;
}

export default function AiRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Install during render, not in an effect: children mount before effects run,
  // and AiBundleMount injects its script on mount.
  ensureRuntime();
  return <>{children}</>;
}
