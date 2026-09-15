import { describe, expect, it } from "vitest";

import type { StockImage } from "@/lib/stock-images";
import {
  STOCK_TOOL_NAMES,
  formatCandidates,
  formatUseResult,
  thumbRelPath,
} from "@/worker/lib/stock-tools";

const image = (over: Partial<StockImage> = {}): StockImage => ({
  provider: "pexels",
  id: "3184405",
  description: "Long table set for a dinner under string lights",
  width: 5184,
  height: 3456,
  thumbUrl: "https://images.pexels.com/medium.jpeg",
  fullUrl: "https://images.pexels.com/large.jpeg",
  credit: "Photo by Fauxels on Pexels (https://www.pexels.com/photo/1/)",
  pageUrl: "https://www.pexels.com/photo/1/",
  ...over,
});

describe("thumbRelPath", () => {
  it("names the preview by provider and id inside refs/stock", () => {
    expect(thumbRelPath(image(), "image/jpeg")).toBe("refs/stock/pexels-3184405.jpg");
  });

  it("follows the downloaded content type's extension", () => {
    expect(thumbRelPath(image({ provider: "unsplash", id: "Pn6" }), "image/webp")).toBe(
      "refs/stock/unsplash-Pn6.webp",
    );
  });
});

describe("formatCandidates", () => {
  const candidates = [
    { image: image(), thumbPath: "refs/stock/pexels-3184405.jpg" },
    {
      image: image({ provider: "pixabay", id: "1508202", description: "wedding arch, beach" }),
      thumbPath: null,
    },
  ];

  it("lists each candidate with the id needed to claim it", () => {
    const text = formatCandidates({
      query: "olive grove",
      candidates,
      providers: [{ provider: "pexels", status: "ok" }],
    });

    expect(text).toContain('olive grove');
    expect(text).toContain("pexels/3184405");
    expect(text).toContain("5184x3456");
    expect(text).toContain("Long table set for a dinner under string lights");
    expect(text).toContain("refs/stock/pexels-3184405.jpg");
  });

  it("says when a preview could not be downloaded rather than inventing a path", () => {
    const text = formatCandidates({
      query: "olive grove",
      candidates,
      providers: [{ provider: "pixabay", status: "ok" }],
    });

    expect(text).toContain("pixabay/1508202");
    expect(text).toMatch(/no preview/i);
  });

  it("reports a provider that failed so the agent knows the list is partial", () => {
    const text = formatCandidates({
      query: "olive grove",
      candidates,
      providers: [
        { provider: "pexels", status: "ok" },
        { provider: "unsplash", status: "error", note: "HTTP 429" },
      ],
    });

    expect(text).toContain("unsplash");
    expect(text).toContain("HTTP 429");
  });

  it("explains the next step instead of leaving a bare list", () => {
    const text = formatCandidates({
      query: "olive grove",
      candidates,
      providers: [{ provider: "pexels", status: "ok" }],
    });

    expect(text).toContain("use_image");
  });

  it("says plainly when nothing matched", () => {
    const text = formatCandidates({
      query: "olive grove",
      candidates: [],
      providers: [{ provider: "pexels", status: "ok" }],
    });

    expect(text).toMatch(/no images/i);
  });

  it("says when no provider is configured at all", () => {
    const text = formatCandidates({ query: "olive grove", candidates: [], providers: [] });

    expect(text).toMatch(/not configured/i);
  });
});

describe("formatUseResult", () => {
  const url = "https://bucket.s3.amazonaws.com/ai-stock/inv_1/pexels-3184405.jpg";

  it("returns the permanent url and the credit to record", () => {
    const text = formatUseResult(image(), url, { width: 1880, height: 1253 });

    expect(text).toContain(url);
    expect(text).toContain("Photo by Fauxels on Pexels");
  });

  it("reports the stored size, not the original — width/height come from this", () => {
    const text = formatUseResult(image(), url, { width: 1880, height: 1253 });

    expect(text).toContain("1880x1253");
    // 5184x3456 is the size of the provider's original, which is NOT what was
    // stored; quoting it would have the optimizer upscale the file it has.
    expect(text).not.toContain("5184x3456");
  });

  it("warns against asking for more pixels than were stored", () => {
    const text = formatUseResult(image(), url, { width: 1880, height: 1253 });

    expect(text).toMatch(/do not .*(larger|exceed)/i);
  });

  it("falls back to the provider's numbers when the file could not be measured", () => {
    const text = formatUseResult(image(), url, null);

    expect(text).toContain("5184x3456");
  });
});

describe("STOCK_TOOL_NAMES", () => {
  it("are the fully-qualified names the agent's allowedTools must carry", () => {
    expect(STOCK_TOOL_NAMES).toEqual([
      "mcp__stock__search_images",
      "mcp__stock__use_image",
    ]);
  });
});
