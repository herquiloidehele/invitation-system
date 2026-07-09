import { describe, expect, it } from "vitest";
import { resolveRsvpInputColors } from "@/lib/rsvp-input-colors";

describe("resolveRsvpInputColors", () => {
  const defaults = {
    backgroundColor: "#ffffff",
    textColor: "#111111",
    placeholderColor: "#999999",
    borderColor: "#dddddd",
  };

  it("falls back to defaults when RSVP colors are missing or blank", () => {
    expect(resolveRsvpInputColors(undefined, defaults)).toEqual(defaults);
    expect(
      resolveRsvpInputColors(
        {
          inputBackgroundColor: "",
          inputTextColor: "   ",
          inputPlaceholderColor: undefined,
          inputBorderColor: "",
        },
        defaults,
      ),
    ).toEqual(defaults);
  });

  it("uses provided RSVP colors without changing unrelated defaults", () => {
    expect(
      resolveRsvpInputColors(
        {
          inputBackgroundColor: "#050505",
          inputTextColor: "#f7f7f7",
          inputPlaceholderColor: "#b8a15c",
          inputBorderColor: "#d4af37",
        },
        defaults,
      ),
    ).toEqual({
      backgroundColor: "#050505",
      textColor: "#f7f7f7",
      placeholderColor: "#b8a15c",
      borderColor: "#d4af37",
    });
  });
});
