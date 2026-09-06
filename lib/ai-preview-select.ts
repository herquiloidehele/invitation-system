/**
 * The click-to-reference contract and the DOM helpers that turn a clicked node
 * into a human-readable descriptor. Shared by the in-iframe capture bridge and
 * the admin console. DOM helpers take measurements (offsetTop, docHeight) as
 * plain numbers so they are unit-testable under jsdom without a real layout.
 */
export type SelectedPosition = "top" | "upper" | "middle" | "lower" | "bottom";

export type SelectedElementDescriptor = {
  tag: string;
  text: string;
  nearestHeading: string | null;
  position: SelectedPosition;
};

export const AI_PREVIEW_SELECT_MODE = "ai-preview-select-mode";
export const AI_PREVIEW_SELECTED = "ai-preview-selected";

export type SelectModeMessage = {
  type: typeof AI_PREVIEW_SELECT_MODE;
  enabled: boolean;
};
export type SelectedMessage = {
  type: typeof AI_PREVIEW_SELECTED;
  descriptor: SelectedElementDescriptor;
  /** A cropped PNG data URL of the block, or null if rasterization failed. */
  png: string | null;
};

/** Tags that count as a meaningful "block" to snap onto. */
const BLOCK_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "IMG",
  "BUTTON",
  "A",
  "FIGURE",
  "SECTION",
  "BLOCKQUOTE",
  "LI",
  "DIV",
]);

export function truncateText(
  value: string | null | undefined,
  max = 80,
): string {
  const s = (value ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function positionBucket(
  offsetTop: number,
  docHeight: number,
): SelectedPosition {
  if (docHeight <= 0) return "top";
  const r = Math.min(1, Math.max(0, offsetTop / docHeight));
  if (r < 0.2) return "top";
  if (r < 0.4) return "upper";
  if (r < 0.6) return "middle";
  if (r < 0.8) return "lower";
  return "bottom";
}

/**
 * From the clicked node, climb to the smallest meaningful block (a heading, p,
 * img, button, link, section, etc., or anything with a role). Stops before the
 * mount root; if nothing meaningful is found, returns the original node so the
 * caller always gets something addressable.
 */
export function snapToBlock(node: Element, root: Element): Element {
  let el: Element | null = node;
  while (el && el !== root) {
    if (BLOCK_TAGS.has(el.tagName) || el.getAttribute("role")) return el;
    el = el.parentElement;
  }
  return node;
}

const HEADINGS = "h1,h2,h3,h4,h5,h6";

export function nearestHeadingText(el: Element, root: Element): string | null {
  if (/^H[1-6]$/.test(el.tagName)) {
    return truncateText(el.textContent, 60) || null;
  }
  let cur: Element | null = el;
  while (cur && cur !== root) {
    let sib: Element | null = cur.previousElementSibling;
    while (sib) {
      const h = sib.matches?.(HEADINGS) ? sib : sib.querySelector?.(HEADINGS);
      if (h) return truncateText(h.textContent, 60) || null;
      sib = sib.previousElementSibling;
    }
    cur = cur.parentElement;
  }
  return null;
}

export function describeSelectedElement(
  el: Element,
  root: Element,
  offsetTop: number,
  docHeight: number,
): SelectedElementDescriptor {
  return {
    tag: el.tagName.toLowerCase(),
    text: truncateText(el.textContent),
    nearestHeading: nearestHeadingText(el, root),
    position: positionBucket(offsetTop, docHeight),
  };
}
