import { describe, expect, it } from "vitest";

import { createBundleRegistry } from "@/lib/ai-bundle-registry";

const Component = () => null;

describe("createBundleRegistry", () => {
  it("returns undefined for an unregistered id", () => {
    const registry = createBundleRegistry();
    expect(registry.get("missing")).toBeUndefined();
  });

  it("returns a component registered under an id", () => {
    const registry = createBundleRegistry();
    registry.register("a", Component);
    expect(registry.get("a")).toBe(Component);
  });

  it("resolves a waiter that subscribed before registration", async () => {
    const registry = createBundleRegistry();
    const pending = registry.whenRegistered("a");
    registry.register("a", Component);
    await expect(pending).resolves.toBe(Component);
  });

  it("resolves a waiter that subscribed after registration", async () => {
    const registry = createBundleRegistry();
    registry.register("a", Component);
    await expect(registry.whenRegistered("a")).resolves.toBe(Component);
  });

  it("resolves every waiter for the same id", async () => {
    const registry = createBundleRegistry();
    const first = registry.whenRegistered("a");
    const second = registry.whenRegistered("a");
    registry.register("a", Component);
    await expect(Promise.all([first, second])).resolves.toEqual([
      Component,
      Component,
    ]);
  });

  it("ignores a duplicate registration for the same id", () => {
    const registry = createBundleRegistry();
    const Other = () => null;
    registry.register("a", Component);
    registry.register("a", Other);
    expect(registry.get("a")).toBe(Component);
  });
});
