import assert from "node:assert/strict";
import { getSaveTheDateRsvpButtonBackground } from "../lib/save-the-date-rsvp-button";

const background = getSaveTheDateRsvpButtonBackground({
  heartColor: "#D4AF37",
  heartGlitterColors: ["#F5E6A3"],
  rsvpButtonBgColor: "#8B5CF6",
});

assert.equal(background, "#8B5CF6");
