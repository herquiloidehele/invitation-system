import { describe, expect, it } from "vitest";

import { getSaveTheDateBackgroundStyle } from "@/lib/save-the-date-background";

describe("getSaveTheDateBackgroundStyle", () => {
  it("returns no image styles for an empty URL", () => {
    expect(
      getSaveTheDateBackgroundStyle("", {
        positionX: 50,
        positionY: 50,
        zoom: 1,
      }),
    ).toEqual({});
  });

  it("builds a cover background with the configured crop", () => {
    expect(
      getSaveTheDateBackgroundStyle("https://example.com/palms.jpg", {
        positionX: 35,
        positionY: 65,
        zoom: 1.2,
      }),
    ).toMatchObject({
      backgroundSize: "120%",
      backgroundPosition: "35% 65%",
    });
  });
});
