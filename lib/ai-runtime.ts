import type { BundleRegistry } from "./ai-bundle-registry";
import type { PlatformApi } from "./ai-platform-types";

/** Global key holding the host-provided runtime. */
export const AI_RUNTIME_KEY = "__INVITATION_AI_RUNTIME__";

/**
 * What the host lends to generated bundles. Bundles are built with `react`,
 * `react/jsx-runtime` and `framer-motion` marked external and aliased to shims
 * that read these fields — so a bundle ships without them and shares the host's
 * single React instance (two instances would break hooks and context).
 *
 * `platform` is empty in Phase 1; the `@platform` SDK fills it in Phase 2.
 */
export interface AiRuntime {
  react: unknown;
  jsxRuntime: unknown;
  framerMotion: unknown;
  /** The `@platform` SDK surface. Empty object before the provider builds it. */
  platform: PlatformApi | Record<string, never>;
  bundles: BundleRegistry;
}

/** Read the installed runtime, or undefined before the provider mounts. */
export function getAiRuntime(): AiRuntime | undefined {
  return (globalThis as Record<string, unknown>)[AI_RUNTIME_KEY] as
    | AiRuntime
    | undefined;
}
