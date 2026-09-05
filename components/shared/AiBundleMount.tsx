"use client";

import { type ReactElement, useEffect, useState } from "react";

import type { BundleComponent } from "@/lib/ai-bundle-registry";
import { getAiRuntime } from "@/lib/ai-runtime";
import type { AiBundleProps } from "@/lib/ai-invitation-props";

interface AiBundleMountProps {
  /** Absolute or same-origin URL of the IIFE bundle. */
  url: string;
  /** Registration id the bundle uses. Stable per invitation. */
  bundleId: string;
  props: AiBundleProps;
}

/**
 * Loads a generated bundle and renders it.
 *
 * The bundle is an IIFE that calls
 * `__INVITATION_AI_RUNTIME__.bundles.register(id, Component)` when it executes,
 * so a plain `<script src>` is enough — no import map, and no
 * `new Function("return import(u)")`, which would require CSP `unsafe-eval`.
 */
export default function AiBundleMount({
  url,
  bundleId,
  props,
}: AiBundleMountProps) {
  const [Component, setComponent] = useState<BundleComponent | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);

  // Read during render: AiRuntimeProvider installs the runtime before this
  // child mounts, so a missing runtime is a render-phase error state rather
  // than something to discover in an effect.
  const runtime = getAiRuntime();

  useEffect(() => {
    if (!runtime) return;

    let cancelled = false;

    void runtime.bundles.whenRegistered(bundleId).then((component) => {
      if (!cancelled) setComponent(() => component);
    });

    // A cached script element does not re-execute, but the component is already
    // in the registry in that case, so the promise above resolves immediately.
    const selector = `script[data-ai-bundle="${CSS.escape(bundleId)}"]`;
    if (!document.querySelector(selector)) {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.dataset.aiBundle = bundleId;
      script.addEventListener("error", () => {
        if (!cancelled) setScriptFailed(true);
      });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [url, bundleId, runtime]);

  if (!runtime || scriptFailed) {
    return (
      <div
        role="alert"
        style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}
      >
        This invitation could not be loaded.
      </div>
    );
  }

  if (!Component) return null;

  const Rendered = Component as unknown as (p: AiBundleProps) => ReactElement;
  return (
    // `data-ai-mounted` exists only once the bundle has registered and rendered:
    // the signal the admin preview's capture bridge waits for. display:contents
    // keeps the wrapper out of layout.
    <div data-ai-mounted="1" style={{ display: "contents" }}>
      <Rendered {...props} />
    </div>
  );
}
