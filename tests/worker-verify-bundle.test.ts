import { describe, expect, it } from "vitest";

import { bundleRegistersComponent } from "@/worker/lib/verify-bundle";

const GOOD = `(() => {
  const rt = globalThis.__INVITATION_AI_RUNTIME__;
  rt.bundles.register("inv_1", function C(){ return null; });
})();`;

const NO_REGISTER = `(() => { const x = 1; void x; })();`;
const WRONG_TYPE = `(() => {
  globalThis.__INVITATION_AI_RUNTIME__.bundles.register("inv_1", 42);
})();`;

describe("bundleRegistersComponent", () => {
  it("returns true when the bundle registers a function under the id", () => {
    expect(bundleRegistersComponent(GOOD, "inv_1")).toBe(true);
  });

  it("returns false when nothing registers", () => {
    expect(bundleRegistersComponent(NO_REGISTER, "inv_1")).toBe(false);
  });

  it("returns false when the registered value is not a function", () => {
    expect(bundleRegistersComponent(WRONG_TYPE, "inv_1")).toBe(false);
  });

  it("returns false when the bundle throws", () => {
    expect(bundleRegistersComponent("throw new Error('boom')", "inv_1")).toBe(false);
  });
});
