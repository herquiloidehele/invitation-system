import { describe, expect, it } from "vitest";
import { getSaveTheDateRsvpButtonBackground } from "../lib/save-the-date-rsvp-button";

describe("getSaveTheDateRsvpButtonBackground", () => {
  it("returns the explicit rsvpButtonBgColor", () => {
    const background = getSaveTheDateRsvpButtonBackground({
      heartColor: "#D4AF37",
      heartGlitterColors: ["#F5E6A3"],
      rsvpButtonBgColor: "#8B5CF6",
    });
    expect(background).toBe("#8B5CF6");
  });
});
