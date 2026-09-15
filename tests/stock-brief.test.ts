import { describe, expect, it } from "vitest";

import { buildStockBrief } from "@/worker/lib/stock-brief";

describe("buildStockBrief", () => {
  it("names both tools the agent can call", () => {
    const text = buildStockBrief();

    expect(text).toContain("search_images");
    expect(text).toContain("use_image");
  });

  it("tells the agent to look at the previews before choosing", () => {
    const text = buildStockBrief();

    expect(text).toContain("refs/stock");
    expect(text).toContain("Read");
  });

  it("allows only the mirrored url in the source", () => {
    const text = buildStockBrief();

    expect(text).toMatch(/never a provider url/i);
    expect(text).toContain("<Media");
  });

  it("asks for the credit line to be recorded", () => {
    expect(buildStockBrief()).toMatch(/credit/i);
  });

  it("keeps a stock photo from standing in for the couple", () => {
    expect(buildStockBrief()).toMatch(/couple/i);
  });

  it("leaves using no photograph at all on the table", () => {
    expect(buildStockBrief()).toMatch(/typographic/i);
  });
});
