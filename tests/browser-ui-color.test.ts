import { describe, expect, it } from "vitest";
import { resolveBrowserUiColor } from "@/lib/browser-ui-color";

describe("resolveBrowserUiColor", () => {
  it("uses explicit browserUiColor before other colors", () => {
    expect(
      resolveBrowserUiColor({
        envelope: {
          browserUiColor: "#112233",
          coverBackground: "#445566",
          base: "#778899",
        },
        themeEnvelopeBase: "#aabbcc",
        pageBackground: "#ddeeff",
      }),
    ).toBe("#112233");
  });

  it("falls back to a hex cover background", () => {
    expect(
      resolveBrowserUiColor({
        envelope: { coverBackground: "#445566", base: "#778899" },
        themeEnvelopeBase: "#aabbcc",
        pageBackground: "#ddeeff",
      }),
    ).toBe("#445566");
  });

  it("ignores image cover backgrounds and falls back to envelope base", () => {
    expect(
      resolveBrowserUiColor({
        envelope: {
          coverBackground: "https://cdn.example.com/envelope.jpg",
          base: "#778899",
        },
        themeEnvelopeBase: "#aabbcc",
        pageBackground: "#ddeeff",
      }),
    ).toBe("#778899");
  });

  it("falls back to the theme envelope base when overrides are missing", () => {
    expect(
      resolveBrowserUiColor({
        envelope: null,
        themeEnvelopeBase: "#aabbcc",
        pageBackground: "#ddeeff",
      }),
    ).toBe("#aabbcc");
  });

  it("falls back to page background when envelope colors are invalid", () => {
    expect(
      resolveBrowserUiColor({
        envelope: { browserUiColor: "red", coverBackground: "", base: "#123" },
        themeEnvelopeBase: "linear-gradient(red, blue)",
        pageBackground: "#ddeeff",
      }),
    ).toBe("#ddeeff");
  });

  it("returns undefined when no candidate is a six-digit hex color", () => {
    expect(
      resolveBrowserUiColor({
        envelope: { browserUiColor: "red", coverBackground: "/cover.png" },
        themeEnvelopeBase: "",
        pageBackground: "transparent",
      }),
    ).toBeUndefined();
  });
});
