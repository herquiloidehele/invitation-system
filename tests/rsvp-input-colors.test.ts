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
    const expected = { ...defaults, switchLabelColor: "#111111" };
    expect(resolveRsvpInputColors(undefined, defaults)).toEqual(expected);
    expect(
      resolveRsvpInputColors(
        {
          inputBackgroundColor: "",
          inputTextColor: "   ",
          inputPlaceholderColor: undefined,
          inputBorderColor: "",
          inputSwitchLabelColor: "  ",
        },
        defaults,
      ),
    ).toEqual(expected);
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
      switchLabelColor: "#f7f7f7",
    });
  });

  it("colours the switch label on its own, leaving the field text alone", () => {
    const colors = resolveRsvpInputColors(
      { inputSwitchLabelColor: "#222222" },
      defaults,
    );
    expect(colors.switchLabelColor).toBe("#222222");
    expect(colors.textColor).toBe("#111111");
  });

  it("keeps an explicit switch label colour when the field text is also set", () => {
    const colors = resolveRsvpInputColors(
      { inputTextColor: "#f7f7f7", inputSwitchLabelColor: "#222222" },
      defaults,
    );
    expect(colors.switchLabelColor).toBe("#222222");
    expect(colors.textColor).toBe("#f7f7f7");
  });
});
