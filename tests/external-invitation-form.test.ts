import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  appendCanvaProxyHideScrollbarFlag,
  isInitialCanvaEmbedPage,
  resolveCanvaEmbedPageState,
  shouldPreloadRichExternalCanva,
  shouldShowRichExternalRsvp,
  shouldShowVideoEntranceInitialSections,
} from "../lib/external-invitation-form";

describe("isInitialCanvaEmbedPage", () => {
  const initial = "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1";

  it("returns true for the original Canva embed URL", () => {
    expect(isInitialCanvaEmbedPage(initial, initial)).toBe(true);
  });

  it("returns false for Canva page hash navigation", () => {
    expect(
      isInitialCanvaEmbedPage(
        "/canva-proxy/brindealstudio.com/sara-e-hugo/?disableScroll=1#page-0",
        initial,
      ),
    ).toBe(false);
  });

  it("returns false for Canva page path navigation", () => {
    expect(
      isInitialCanvaEmbedPage(
        "/canva-proxy/brindealstudio.com/sara-e-hugo/page-2?disableScroll=1",
        initial,
      ),
    ).toBe(false);
  });
});

describe("appendCanvaProxyHideScrollbarFlag", () => {
  it("adds hideScrollbar=1 to a bare proxy src", () => {
    expect(
      appendCanvaProxyHideScrollbarFlag(
        "/canva-proxy/brindealstudio.com/sara-e-hugo",
      ),
    ).toBe("/canva-proxy/brindealstudio.com/sara-e-hugo?hideScrollbar=1");
  });

  it("preserves existing query params and the hash", () => {
    expect(
      appendCanvaProxyHideScrollbarFlag(
        "/canva-proxy/brindealstudio.com/sara-e-hugo?foo=bar#page-1",
      ),
    ).toBe(
      "/canva-proxy/brindealstudio.com/sara-e-hugo?foo=bar&hideScrollbar=1#page-1",
    );
  });

  it("is idempotent — does not duplicate the flag", () => {
    const once = appendCanvaProxyHideScrollbarFlag(
      "/canva-proxy/brindealstudio.com/sara-e-hugo",
    );
    expect(appendCanvaProxyHideScrollbarFlag(once)).toBe(once);
  });

  it("leaves non-proxy srcs untouched (we don't control their HTML)", () => {
    expect(
      appendCanvaProxyHideScrollbarFlag("https://example.com/some-invite"),
    ).toBe("https://example.com/some-invite");
    expect(appendCanvaProxyHideScrollbarFlag("")).toBe("");
  });
});

describe("shouldShowRichExternalRsvp", () => {
  it("shows RSVP only when RSVP is enabled and the original Canva page is active", () => {
    expect(
      shouldShowRichExternalRsvp({ rsvpOn: true, isInitialCanvaPage: true }),
    ).toBe(true);
    expect(
      shouldShowRichExternalRsvp({ rsvpOn: true, isInitialCanvaPage: false }),
    ).toBe(false);
    expect(
      shouldShowRichExternalRsvp({ rsvpOn: false, isInitialCanvaPage: true }),
    ).toBe(false);
  });
});

describe("shouldShowVideoEntranceInitialSections", () => {
  it("shows initial-only sections before iframe navigation", () => {
    expect(
      shouldShowVideoEntranceInitialSections({ isInitialCanvaPage: true }),
    ).toBe(true);
  });

  it("hides initial-only sections while iframe is on a non-initial page", () => {
    expect(
      shouldShowVideoEntranceInitialSections({ isInitialCanvaPage: false }),
    ).toBe(false);
  });
});

describe("resolveCanvaEmbedPageState", () => {
  const externalLink = "https://brindealstudio.com/sara-e-hugo";
  const initial = "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1";

  it("clears the navigated iframe src when browser Back restores the original iframe document", () => {
    expect(
      resolveCanvaEmbedPageState({
        actualSrc:
          "http://localhost:3000/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1",
        externalLink,
        initialSrc: initial,
      }),
    ).toEqual({
      isInitialPage: true,
      navigatedProxiedUrl: null,
    });
  });

  it("keeps a navigated iframe src when browser Forward restores a Canva subpage", () => {
    expect(
      resolveCanvaEmbedPageState({
        actualSrc:
          "http://localhost:3000/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
        externalLink,
        initialSrc: initial,
      }),
    ).toEqual({
      isInitialPage: false,
      navigatedProxiedUrl: {
        externalLink,
        src: "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
      },
    });
  });

  it("preserves the requested iframe src when browser Back restores the original iframe document", () => {
    const currentNavigatedProxiedUrl = {
      externalLink,
      src: "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
    };

    expect(
      resolveCanvaEmbedPageState({
        actualSrc:
          "http://localhost:3000/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1",
        currentNavigatedProxiedUrl,
        externalLink,
        initialSrc: initial,
      }),
    ).toEqual({
      isInitialPage: true,
      navigatedProxiedUrl: currentNavigatedProxiedUrl,
    });
  });

  it("normalizes absolute iframe URLs from any deployment domain", () => {
    expect(
      resolveCanvaEmbedPageState({
        actualSrc:
          "https://convites.example.com/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
        externalLink,
        initialSrc: initial,
      }),
    ).toEqual({
      isInitialPage: false,
      navigatedProxiedUrl: {
        externalLink,
        src: "/canva-proxy/brindealstudio.com/sara-e-hugo?disableScroll=1#page-0",
      },
    });
  });
});

describe("external invitation helper source", () => {
  it("does not hardcode a localhost URL base", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/external-invitation-form.ts"),
      "utf8",
    );

    expect(source).not.toContain("localhost");
  });

  it("forwards scratch reveal background image props in the rich external page", () => {
    const source = readFileSync(
      join(process.cwd(), "components/shared/RichExternalLinkPage.tsx"),
      "utf8",
    );

    expect(source).toContain(
      "backgroundImageUrl={invitation.scratchReveal?.backgroundImageUrl}",
    );
    expect(source).toContain(
      "scrimOpacity={invitation.scratchReveal?.scrimOpacity}",
    );
    expect(source).toContain("imageSettings={invitation.imageSettings}");
  });
});

describe("shouldPreloadRichExternalCanva", () => {
  it("preloads off-viewport until the rich external page is visible", () => {
    expect(
      shouldPreloadRichExternalCanva({ isPreview: false, isVisible: false }),
    ).toBe(true);
    expect(
      shouldPreloadRichExternalCanva({ isPreview: false, isVisible: true }),
    ).toBe(false);
  });

  it("does not preload off-viewport in admin preview", () => {
    expect(
      shouldPreloadRichExternalCanva({ isPreview: true, isVisible: false }),
    ).toBe(false);
  });
});
