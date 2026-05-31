import { describe, expect, it, vi } from "vitest";
import { createTimerTracker } from "../lib/cleanup";

describe("createTimerTracker", () => {
  it("returns timer IDs added via track()", () => {
    const tracker = createTimerTracker();
    const id = tracker.track(123);
    expect(id).toBe(123);
  });

  it("clears all tracked timeouts when clearAll() is called", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const tracker = createTimerTracker();
    tracker.track(1);
    tracker.track(2);
    tracker.track(3);
    tracker.clearAll();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(3);
    expect(clearTimeoutSpy).toHaveBeenNthCalledWith(1, 1);
    expect(clearTimeoutSpy).toHaveBeenNthCalledWith(2, 2);
    expect(clearTimeoutSpy).toHaveBeenNthCalledWith(3, 3);
    clearTimeoutSpy.mockRestore();
  });

  it("does not re-clear already-cleared timers when clearAll() is called twice", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const tracker = createTimerTracker();
    tracker.track(7);
    tracker.clearAll();
    tracker.clearAll();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    clearTimeoutSpy.mockRestore();
  });
});
