import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { autoScrollFrame, isUserScroll } from "../lib/auto-scroll";

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
    expect(isUserScroll(200, 200)).toBe(false);
    expect(isUserScroll(202, 200)).toBe(false);
  });
  it("detects a real move in either direction", () => {
    expect(isUserScroll(260, 200)).toBe(true);
    expect(isUserScroll(120, 200)).toBe(true);
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
