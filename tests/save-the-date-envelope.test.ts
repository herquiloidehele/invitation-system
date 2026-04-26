import assert from "node:assert/strict";
import { getSaveTheDateEnvelopeCoverBackground } from "../lib/save-the-date-envelope";

const overrideBackground = getSaveTheDateEnvelopeCoverBackground(
  { base: "#f7f0e8", topFlap: "/top.png", bottomFlap: "/bottom.png" },
  { coverBackground: "https://cdn.example.com/std-cover.jpg" },
);
assert.equal(overrideBackground, "https://cdn.example.com/std-cover.jpg");

const fallbackBackground = getSaveTheDateEnvelopeCoverBackground(
  { base: "#f7f0e8", topFlap: "/top.png", bottomFlap: "/bottom.png" },
  { base: "#111827" },
);
assert.equal(fallbackBackground, "#111827");

const themeFallbackBackground = getSaveTheDateEnvelopeCoverBackground(
  { base: "#f7f0e8", topFlap: "/top.png", bottomFlap: "/bottom.png" },
  null,
);
assert.equal(themeFallbackBackground, "#f7f0e8");
