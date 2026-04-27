import { describe, expect, it } from "vitest";
import { getCoverBackgroundStyle } from "../lib/envelope-cover-background";

describe("getCoverBackgroundStyle", () => {
  it("returns backgroundColor for a hex color", () => {
    expect(getCoverBackgroundStyle("#111827", "#ffffff")).toEqual({
      backgroundColor: "#111827",
    });
  });

  it("falls back to the second arg when value is empty", () => {
    expect(getCoverBackgroundStyle("", "#f7f0e8")).toEqual({
      backgroundColor: "#f7f0e8",
    });
  });

  it("returns a backgroundImage for an absolute URL", () => {
    expect(
      getCoverBackgroundStyle("https://cdn.example.com/envelope.jpg", "#ffffff"),
    ).toEqual({
      backgroundImage: 'url("https://cdn.example.com/envelope.jpg")',
      backgroundPosition: "center",
      backgroundSize: "cover",
    });
  });

  it("returns a backgroundImage for a local path", () => {
    expect(getCoverBackgroundStyle("/images/envelope.png", "#ffffff")).toEqual({
      backgroundImage: 'url("/images/envelope.png")',
      backgroundPosition: "center",
      backgroundSize: "cover",
    });
  });
});
