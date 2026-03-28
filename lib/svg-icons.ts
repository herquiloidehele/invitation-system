const ALLOWED_SVG_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "rect",
  "defs",
  "clipPath",
  "mask",
  "linearGradient",
  "radialGradient",
  "stop",
  "title",
  "desc",
]);

const ALLOWED_SVG_ATTRS = new Set([
  "clip-path",
  "clip-rule",
  "cx",
  "cy",
  "d",
  "fill",
  "fill-opacity",
  "fill-rule",
  "gradientTransform",
  "gradientUnits",
  "height",
  "id",
  "mask",
  "maskUnits",
  "maskContentUnits",
  "offset",
  "opacity",
  "patternUnits",
  "points",
  "preserveAspectRatio",
  "r",
  "rx",
  "ry",
  "spreadMethod",
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "transform",
  "viewBox",
  "width",
  "x",
  "x1",
  "x2",
  "xmlns",
  "y",
  "y1",
  "y2",
]);

export function sanitizeAndNormalizeSvg(svgText: string): string | null {
  if (typeof DOMParser === "undefined") return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const root = doc.documentElement;

  if (root.nodeName.toLowerCase() !== "svg") {
    return null;
  }

  if (doc.querySelector("parsererror")) {
    return null;
  }

  sanitizeNode(root);

  root.setAttribute("width", "100%");
  root.setAttribute("height", "100%");
  root.setAttribute("preserveAspectRatio", "xMidYMid meet");
  root.setAttribute("fill", "currentColor");
  root.setAttribute("stroke", "currentColor");
  root.setAttribute("focusable", "false");
  root.setAttribute("aria-hidden", "true");

  return root.outerHTML;
}

function sanitizeNode(node: Element) {
  for (const child of Array.from(node.children)) {
    if (!ALLOWED_SVG_TAGS.has(child.tagName)) {
      child.remove();
      continue;
    }

    sanitizeAttributes(child);
    sanitizeNode(child);
  }

  sanitizeAttributes(node);
}

function sanitizeAttributes(node: Element) {
  for (const attr of Array.from(node.attributes)) {
    const name = attr.name;
    const value = attr.value.trim();

    if (
      !ALLOWED_SVG_ATTRS.has(name) ||
      name.startsWith("on") ||
      name === "href" ||
      name === "xlink:href" ||
      name === "style" ||
      name === "class"
    ) {
      node.removeAttribute(name);
      continue;
    }

    if (name === "fill" || name === "stroke" || name === "stop-color") {
      node.setAttribute(name, normalizePaint(value));
    }
  }
}

function normalizePaint(value: string): string {
  const normalized = value.toLowerCase();

  if (!normalized || normalized === "none") {
    return "none";
  }

  if (normalized === "currentcolor") {
    return "currentColor";
  }

  if (normalized.startsWith("url(")) {
    return value;
  }

  return "currentColor";
}
