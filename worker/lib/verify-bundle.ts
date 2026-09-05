import vm from "node:vm";

/**
 * True when running `code` (an IIFE bundle) registers a **function** component
 * under `bundleId` against a stub runtime. Mirrors the manual eval used to
 * verify the fixture. Runs in a fresh VM context — never throws to the caller.
 */
export function bundleRegistersComponent(code: string, bundleId: string): boolean {
  const registered: Record<string, unknown> = {};
  const noop = () => ({});
  const sandbox: Record<string, unknown> = {
    __INVITATION_AI_RUNTIME__: {
      react: {},
      jsxRuntime: { jsx: noop, jsxs: noop, Fragment: Symbol("f") },
      framerMotion: { motion: new Proxy({}, { get: () => () => ({}) }) },
      platform: new Proxy({}, { get: () => noop }),
      bundles: {
        register: (id: string, c: unknown) => {
          registered[id] = c;
        },
      },
    },
  };
  sandbox.globalThis = sandbox;
  try {
    vm.runInNewContext(code, sandbox, { timeout: 2000 });
  } catch {
    return false;
  }
  return typeof registered[bundleId] === "function";
}
