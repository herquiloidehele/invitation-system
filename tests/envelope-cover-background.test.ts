import assert from "node:assert/strict";
import { getCoverBackgroundStyle } from "../lib/envelope-cover-background";

const colorStyle = getCoverBackgroundStyle("#111827", "#ffffff");
assert.deepEqual(colorStyle, { backgroundColor: "#111827" });

const emptyStyle = getCoverBackgroundStyle("", "#f7f0e8");
assert.deepEqual(emptyStyle, { backgroundColor: "#f7f0e8" });

const imageStyle = getCoverBackgroundStyle(
  "https://cdn.example.com/envelope.jpg",
  "#ffffff",
);
assert.deepEqual(imageStyle, {
  backgroundImage: "url(\"https://cdn.example.com/envelope.jpg\")",
  backgroundPosition: "center",
  backgroundSize: "cover",
});

const localImageStyle = getCoverBackgroundStyle("/images/envelope.png", "#ffffff");
assert.deepEqual(localImageStyle, {
  backgroundImage: "url(\"/images/envelope.png\")",
  backgroundPosition: "center",
  backgroundSize: "cover",
});
