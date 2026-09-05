import { describe, expect, it } from "vitest";

import { buildAiBundleProps } from "@/lib/ai-invitation-props";
import type { InvitationData } from "@/lib/types";

const invitation = {
  slug: "x",
  couple: { bride: "A", groom: "B" },
  heroImage: "https://cdn/hero.jpg",
  aiAssetLibrary: [
    {
      id: "att1",
      name: "moodboard.png",
      kind: "image",
      url: "https://cdn/moodboard.png",
      width: 800,
      height: 600,
    },
  ],
} as unknown as InvitationData;

describe("buildAiBundleProps", () => {
  it("exposes uploaded attachments as assets.library", () => {
    const props = buildAiBundleProps({
      invitation,
      locale: "pt",
      coverOpened: true,
    });
    expect(props.assets.library).toEqual([
      {
        id: "att1",
        name: "moodboard.png",
        kind: "image",
        url: "https://cdn/moodboard.png",
        width: 800,
        height: 600,
      },
    ]);
  });

  it("defaults to an empty library", () => {
    const props = buildAiBundleProps({
      invitation: {
        ...invitation,
        aiAssetLibrary: undefined,
      } as InvitationData,
      locale: "pt",
      coverOpened: true,
    });
    expect(props.assets.library).toEqual([]);
  });

  it("keeps the existing hero/gallery/sections behaviour", () => {
    const props = buildAiBundleProps({
      invitation,
      locale: "pt",
      coverOpened: true,
    });
    expect(props.assets.hero).toBe("https://cdn/hero.jpg");
    expect(Array.isArray(props.assets.gallery)).toBe(true);
  });
});
