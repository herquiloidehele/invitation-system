/**
 * tsconfig for a bundle workspace. The workspace is created **under the repo**,
 * so tsc's normal `node_modules` walk-up resolves `react`/`react/jsx-runtime`/
 * `framer-motion` (and their `@types`) from the repo — meaningful type errors —
 * while `@platform` resolves to the local ambient `platform.d.ts`. At build time
 * esbuild instead aliases these to the runtime shims: the same split the fixture
 * uses (real types for tsc, shimmed runtime for esbuild).
 */
export function workspaceTsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        lib: ["dom", "dom.iterable", "esnext"],
        jsx: "react-jsx",
        module: "esnext",
        moduleResolution: "bundler",
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ["index.tsx", "platform.d.ts"],
    },
    null,
    2,
  );
}

/** package.json whose `build` runs tsc then the esbuild driver. */
export function workspacePackageJson(): string {
  return JSON.stringify(
    {
      name: "ai-invitation-bundle",
      private: true,
      type: "module",
      scripts: { build: "tsc --noEmit && node build.mjs" },
    },
    null,
    2,
  );
}
