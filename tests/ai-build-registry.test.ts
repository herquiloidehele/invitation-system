import { describe, expect, it, vi } from "vitest";

import {
  registerBuild,
  unregisterBuild,
  getBuildStatus,
  cancelBuild,
  wasCancelled,
} from "@/lib/ai-build-registry";

// Minimal ChildProcess stand-in.
function fakeChild(pid = 1234) {
  return { pid, kill: vi.fn() } as unknown as import("node:child_process").ChildProcess;
}

describe("ai-build-registry", () => {
  it("reports not-running for an unknown slug", () => {
    expect(getBuildStatus("nope")).toEqual({ running: false, startedAt: null });
  });

  it("tracks a running build and clears it", () => {
    const c = fakeChild();
    registerBuild("s1", c);
    const st = getBuildStatus("s1");
    expect(st.running).toBe(true);
    expect(typeof st.startedAt).toBe("number");
    unregisterBuild("s1", c);
    expect(getBuildStatus("s1").running).toBe(false);
  });

  it("unregister only clears the matching child (guards a re-register race)", () => {
    const first = fakeChild(1);
    const second = fakeChild(2);
    registerBuild("s2", first);
    registerBuild("s2", second); // a newer build replaced it
    unregisterBuild("s2", first); // stale close from the old child
    expect(getBuildStatus("s2").running).toBe(true); // second still tracked
    unregisterBuild("s2", second);
    expect(getBuildStatus("s2").running).toBe(false);
  });

  it("cancel returns false when nothing is running", () => {
    expect(cancelBuild("ghost")).toBe(false);
  });

  it("cancel signals the tracked child and returns true", () => {
    const c = fakeChild(4321);
    const spy = vi.spyOn(process, "kill").mockImplementation(() => true as never);
    registerBuild("s3", c);
    expect(cancelBuild("s3")).toBe(true);
    expect(spy).toHaveBeenCalledWith(-4321, "SIGTERM");
    expect(wasCancelled("s3")).toBe(true);
    spy.mockRestore();
    unregisterBuild("s3", c);
    expect(wasCancelled("s3")).toBe(false); // gone → not cancelled
  });
});
