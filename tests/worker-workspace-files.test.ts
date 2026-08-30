import { describe, expect, it } from "vitest";

import {
  workspacePackageJson,
  workspaceTsconfig,
} from "@/worker/lib/workspace-files";

describe("workspaceTsconfig", () => {
  it("is valid JSON enabling jsx and bundler resolution", () => {
    const cfg = JSON.parse(workspaceTsconfig());
    expect(cfg.compilerOptions.jsx).toBe("react-jsx");
    expect(cfg.compilerOptions.noEmit).toBe(true);
    expect(cfg.compilerOptions.moduleResolution).toBe("bundler");
  });

  it("includes index.tsx and the platform d.ts", () => {
    const cfg = JSON.parse(workspaceTsconfig());
    expect(cfg.include).toContain("index.tsx");
    expect(cfg.include).toContain("platform.d.ts");
  });
});

describe("workspacePackageJson", () => {
  it("exposes a build script running tsc then esbuild", () => {
    const pkg = JSON.parse(workspacePackageJson());
    expect(pkg.scripts.build).toContain("tsc");
    expect(pkg.scripts.build).toContain("build.mjs");
  });
});
