import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => children,
  motion: {
    div: ({
      children,
      initial,
      animate,
      variants,
      exit,
      ...props
    }: {
      children?: ReactNode;
      initial?: string;
      animate?: string;
      variants?: unknown;
      exit?: unknown;
      [key: string]: unknown;
    }) => {
      void variants;
      void exit;
      return createElement(
        "div",
        {
          ...props,
          "data-motion-initial": initial,
          "data-motion-animate": animate,
        },
        children,
      );
    },
  },
  useReducedMotion: () => false,
}));

import { AnimatedHeroTextBlock } from "@/components/shared/HeroTextOverlay";
import { DEFAULT_HERO_TEXT_BLOCK } from "@/lib/hero-text";

describe("HeroTextOverlay motion contract", () => {
  it("gives each block its own visible target for late timed mounts", () => {
    const html = renderToStaticMarkup(
      createElement(AnimatedHeroTextBlock, {
        block: {
          ...DEFAULT_HERO_TEXT_BLOCK,
          id: "welcome",
          content: "Welcome",
          startSeconds: 5,
        },
        fonts: {
          display: "Display",
          body: "Body",
          script: "Script",
          ui: "Ui",
        },
        timed: true,
      }),
    );

    expect(html).toMatch(
      /data-motion-initial="hidden" data-motion-animate="visible"[^>]*>Welcome/,
    );
  });
});
