// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
  AI_PREVIEW_SELECT_MODE,
  AI_PREVIEW_SELECTED,
  describeSelectedElement,
  nearestHeadingText,
  positionBucket,
  snapToBlock,
  truncateText,
} from "@/lib/ai-preview-select";

function mount(html: string): HTMLElement {
  const root = document.createElement("div");
  root.setAttribute("data-ai-mounted", "1");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

describe("contract constants", () => {
  it("names the two message types the bridge and console agree on", () => {
    expect(AI_PREVIEW_SELECT_MODE).toBe("ai-preview-select-mode");
    expect(AI_PREVIEW_SELECTED).toBe("ai-preview-selected");
  });
});

describe("truncateText", () => {
  it("collapses whitespace and trims", () => {
    expect(truncateText("  Ana   &   João \n")).toBe("Ana & João");
  });
  it("truncates with an ellipsis past the max", () => {
    expect(truncateText("abcdef", 4)).toBe("abc…");
  });
  it("handles null/undefined", () => {
    expect(truncateText(null)).toBe("");
    expect(truncateText(undefined)).toBe("");
  });
});

describe("positionBucket", () => {
  it("buckets by vertical ratio", () => {
    expect(positionBucket(0, 1000)).toBe("top");
    expect(positionBucket(300, 1000)).toBe("upper");
    expect(positionBucket(500, 1000)).toBe("middle");
    expect(positionBucket(700, 1000)).toBe("lower");
    expect(positionBucket(950, 1000)).toBe("bottom");
  });
  it("is safe when the page has no measured height", () => {
    expect(positionBucket(0, 0)).toBe("top");
  });
});

describe("snapToBlock", () => {
  it("climbs from an inner span to the nearest meaningful block", () => {
    const root = mount('<section><h1>Title <span id="t">bit</span></h1></section>');
    const span = root.querySelector("#t")!;
    expect(snapToBlock(span, root).tagName).toBe("H1");
  });
  it("recognizes a role attribute as a block boundary", () => {
    const root = mount('<div role="button"><span id="s">x</span></div>');
    const span = root.querySelector("#s")!;
    expect(snapToBlock(span, root).getAttribute("role")).toBe("button");
  });
  it("never returns the root; falls back to the clicked node", () => {
    const root = mount('<span id="bare">only</span>');
    const span = root.querySelector("#bare")!;
    // span itself is a meaningful-enough leaf; the walk must stop before root.
    const snapped = snapToBlock(span, root);
    expect(snapped).not.toBe(root);
  });
});

describe("nearestHeadingText", () => {
  it("returns the block's own text when it is a heading", () => {
    const root = mount("<h2>Our Story</h2>");
    expect(nearestHeadingText(root.querySelector("h2")!, root)).toBe("Our Story");
  });
  it("finds the closest preceding heading for a non-heading block", () => {
    const root = mount('<section><h2>Details</h2><p id="p">When & where</p></section>');
    expect(nearestHeadingText(root.querySelector("#p")!, root)).toBe("Details");
  });
  it("returns null when there is no heading", () => {
    const root = mount('<p id="p">lonely</p>');
    expect(nearestHeadingText(root.querySelector("#p")!, root)).toBeNull();
  });
});

describe("describeSelectedElement", () => {
  it("composes tag, text, nearest heading and position", () => {
    const root = mount('<section><h1 id="h">Ana & João</h1></section>');
    const d = describeSelectedElement(root.querySelector("#h")!, root, 0, 1000);
    expect(d).toEqual({
      tag: "h1",
      text: "Ana & João",
      nearestHeading: "Ana & João",
      position: "top",
    });
  });
});
