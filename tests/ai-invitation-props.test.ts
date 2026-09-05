import { describe, expect, it } from "vitest";

import type { InvitationData } from "@/lib/types";
import { buildAiBundleProps } from "@/lib/ai-invitation-props";

function makeInvitation(overrides: Partial<InvitationData> = {}) {
  return {
    slug: "ana-e-bruno",
    heroImage: "https://cdn.example.com/hero.jpg",
    ...overrides,
  } as InvitationData;
}

describe("buildAiBundleProps", () => {
  it("passes through invitation, locale and cover state", () => {
    const invitation = makeInvitation();
    const props = buildAiBundleProps({
      invitation,
      locale: "pt",
      coverOpened: true,
    });

    expect(props.invitation).toBe(invitation);
    expect(props.locale).toBe("pt");
    expect(props.coverOpened).toBe(true);
  });

  it("exposes the hero image in the asset manifest", () => {
    const props = buildAiBundleProps({
      invitation: makeInvitation(),
      locale: "pt",
      coverOpened: false,
    });

    expect(props.assets.hero).toBe("https://cdn.example.com/hero.jpg");
  });

  it("collects section images in a stable key order", () => {
    const props = buildAiBundleProps({
      invitation: makeInvitation({
        sectionImages: { image2: "b.jpg", image1: "a.jpg" },
      }),
      locale: "pt",
      coverOpened: false,
    });

    expect(props.assets.sections).toEqual({ image1: "a.jpg", image2: "b.jpg" });
    expect(Object.keys(props.assets.sections)).toEqual(["image1", "image2"]);
  });

  it("drops empty and non-string section image values", () => {
    const props = buildAiBundleProps({
      invitation: makeInvitation({
        sectionImages: { image1: "", image2: "b.jpg" } as never,
      }),
      locale: "pt",
      coverOpened: false,
    });

    expect(props.assets.sections).toEqual({ image2: "b.jpg" });
  });

  it("collects couple gallery image srcs and defaults to an empty list", () => {
    const withGallery = buildAiBundleProps({
      invitation: makeInvitation({
        coupleGallery: {
          enabled: true,
          style: "grid",
          images: [{ src: "g1.jpg" }, { src: "g2.jpg" }],
        } as never,
      }),
      locale: "pt",
      coverOpened: false,
    });
    expect(withGallery.assets.gallery).toEqual(["g1.jpg", "g2.jpg"]);

    const withoutGallery = buildAiBundleProps({
      invitation: makeInvitation(),
      locale: "pt",
      coverOpened: false,
    });
    expect(withoutGallery.assets.gallery).toEqual([]);
  });

  it("drops gallery images with a missing or empty src", () => {
    const props = buildAiBundleProps({
      invitation: makeInvitation({
        coupleGallery: {
          enabled: true,
          style: "grid",
          images: [{ src: "g1.jpg" }, { src: "" }, { caption: "no src" }],
        } as never,
      }),
      locale: "pt",
      coverOpened: false,
    });
    expect(props.assets.gallery).toEqual(["g1.jpg"]);
  });

  it("defaults guest to null when absent", () => {
    const props = buildAiBundleProps({
      invitation: makeInvitation(),
      locale: "pt",
      coverOpened: false,
    });
    expect(props.guest).toBeNull();
  });

  it("passes the guest through when present", () => {
    const guest = { id: "g1", name: "Ana" } as never;
    const props = buildAiBundleProps({
      invitation: makeInvitation({ guest }),
      locale: "pt",
      coverOpened: false,
    });
    expect(props.guest).toBe(guest);
  });
});
