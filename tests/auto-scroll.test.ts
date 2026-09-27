import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  autoScrollFrame,
  ECHO_FRAMES,
  isUserScroll,
  recordWrite,
} from "../lib/auto-scroll";

describe("autoScrollFrame", () => {
  it("advances by elapsed time, not by frame count", () => {
    const a = autoScrollFrame(1000, { lastMs: 900, lastY: 0 }, 50, 5000);
    expect(a.nextY).toBeCloseTo(5); // 100ms at 50px/s
    expect(a.done).toBe(false);
  });

  it("caps a long gap so returning to a hidden tab doesn't teleport", () => {
    const jump = autoScrollFrame(30000, { lastMs: 0, lastY: 0 }, 50, 5000);
    expect(jump.nextY).toBeCloseTo(5); // 30s clamped to 100ms
  });

  it("stops at the bottom", () => {
    const end = autoScrollFrame(1000, { lastMs: 900, lastY: 4999 }, 50, 5000);
    expect(end.nextY).toBe(5000);
    expect(end.done).toBe(true);
  });

  it("never moves backwards on a clock that goes back", () => {
    const back = autoScrollFrame(500, { lastMs: 900, lastY: 120 }, 50, 5000);
    expect(back.nextY).toBe(120);
  });
});

describe("isUserScroll", () => {
  it("ignores our own write and sub-pixel rounding", () => {
    expect(isUserScroll(200, [200])).toBe(false);
    expect(isUserScroll(202, [200])).toBe(false);
  });
  it("detects a real move in either direction", () => {
    expect(isUserScroll(260, [196, 198, 200])).toBe(true);
    expect(isUserScroll(120, [196, 198, 200])).toBe(true);
  });
  it("tolerates a mobile browser echoing a write from a frame or two ago", () => {
    // Captured on an iPhone: after a slow frame the crawl had written 91.4,
    // while iOS still reported its echo of the earlier 86.9 write, truncated.
    expect(isUserScroll(86, [82.9, 84.9, 86.9, 91.4])).toBe(false);
  });
});

describe("recordWrite", () => {
  it("keeps only the last ECHO_FRAMES writes, oldest first", () => {
    let trail: number[] = [0];
    for (let y = 2; y <= 20; y += 2) trail = recordWrite(trail, y);
    expect(trail).toHaveLength(ECHO_FRAMES);
    expect(trail.at(-1)).toBe(20);
    expect(trail[0]).toBe(20 - 2 * (ECHO_FRAMES - 1));
  });
});

describe("auto-scroll rollout", () => {
  const pages: Record<string, string> = {
    default: "components/shared/InvitationPage.tsx",
    "elegant-floral": "components/elegant-floral/ElegantFloralPage.tsx",
    "minimalism-brown": "components/minimalism-brown/MinimalismBrownPage.tsx",
  };

  for (const [layout, file] of Object.entries(pages)) {
    it(`${layout} drives the crawl from the shared hook`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).toContain('from "@/components/shared/useAutoScroll"');
      // Never in the admin preview, where an editor is trying to work.
      expect(src).toMatch(/useAutoScroll\(\{\s*enabled: !isPreview/);
    });
  }

  it("leaves the crawl out of the layouts that scroll-lock or lead with video", () => {
    for (const file of [
      "components/curtain-canva/CurtainCanvaPage.tsx",
      "components/video-entrance/VideoEntrancePage.tsx",
    ]) {
      expect(readFileSync(file, "utf8")).not.toContain("useAutoScroll");
    }
  });

  it("keeps the frame maths out of any one layout's module", () => {
    const mb = readFileSync("lib/minimalism-brown.ts", "utf8");
    expect(mb).not.toContain("autoScrollFrame");
    expect(mb).not.toContain("isUserScroll");
  });
});
