import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      variants,
      whileInView,
      viewport,
      ...props
    }: {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      variants?: unknown;
      whileInView?: unknown;
      viewport?: unknown;
      [key: string]: unknown;
    }) => {
      void initial;
      void animate;
      void variants;
      void whileInView;
      void viewport;
      return createElement("div", props, children);
    },
  },
}));

import GuestGuideSection from "@/components/shared/GuestGuideSection";
import type { GuestGuideItem, TemplateTheme } from "@/lib/types";

const theme = {
  cardBg: "#fff",
  cardBorder: "#eee",
  accent: "#b59d7a",
  bodyFont: "serif",
  textPrimary: "#333",
} as unknown as TemplateTheme;

function items(count: number): GuestGuideItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    label: `Item ${i}`,
    iconType: "lucide" as const,
    iconName: "Star",
  }));
}

function render(count: number): string {
  return renderToStaticMarkup(
    createElement(GuestGuideSection, {
      guestGuide: { enabled: true, items: items(count) },
      theme,
      isPreview: true,
    }),
  );
}

describe("GuestGuideSection odd-count row", () => {
  it("stretches the last card across both columns when the count is odd", () => {
    const html = render(5);
    const spans = html.match(/col-span-2/g) ?? [];

    expect(spans).toHaveLength(1);
    expect(html.lastIndexOf("col-span-2")).toBeGreaterThan(
      html.indexOf("Item 3"),
    );
  });

  it("leaves every card half-width when the count is even", () => {
    expect(render(4)).not.toContain("col-span-2");
  });

  it("stretches a lone card across the row", () => {
    expect(render(1)).toContain("col-span-2");
  });
});
