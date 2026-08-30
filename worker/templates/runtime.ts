/** Mirrors lib/ai-runtime.ts. Duplicated because bundle source cannot import
 *  from the host app — it is compiled standalone. */
interface HostRuntime {
  react: Record<string, unknown>;
  jsxRuntime: Record<string, unknown>;
  framerMotion: Record<string, unknown>;
  platform: Record<string, unknown>;
  bundles: {
    register(id: string, component: unknown): void;
  };
}

export function hostRuntime(): HostRuntime {
  const runtime = (globalThis as Record<string, unknown>)[
    "__INVITATION_AI_RUNTIME__"
  ] as HostRuntime | undefined;
  if (!runtime) {
    throw new Error(
      "Invitation AI runtime missing — the bundle loaded before AiRuntimeProvider mounted.",
    );
  }
  return runtime;
}
