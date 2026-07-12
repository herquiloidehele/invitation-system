import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VideoPosterLayer from "@/components/shared/VideoPosterLayer";

describe("VideoPosterLayer", () => {
  it("renders a fitted visible poster with the shared fade", () => {
    const html = renderToStaticMarkup(
      createElement(VideoPosterLayer, {
        posterUrl: "https://cdn.example.com/hero-poster.jpg",
        visible: true,
        mediaFit: "cover",
      }),
    );

    expect(html).toContain("data-video-poster-overlay");
    expect(html).toContain("https://cdn.example.com/hero-poster.jpg");
    expect(html).toContain("object-fit:cover");
    expect(html).toContain("opacity:1");
    expect(html).toContain("transition:opacity 200ms ease-out");
  });

  it("renders nothing when a legacy invitation has no poster", () => {
    expect(
      renderToStaticMarkup(
        createElement(VideoPosterLayer, {
          posterUrl: undefined,
          visible: true,
        }),
      ),
    ).toBe("");
  });
});

describe("hero video poster wiring", () => {
  it("wires standard, prefetched, and external video posters", () => {
    const prefetchedSlot = readFileSync(
      "components/shared/PrefetchedVideoSlot.tsx",
      "utf8",
    );
    const invitationHero = readFileSync(
      "components/shared/InvitationHero.tsx",
      "utf8",
    );
    const invitationView = readFileSync(
      "app/[locale]/[slug]/InvitationView.tsx",
      "utf8",
    );
    const externalVideo = readFileSync(
      "components/shared/ExternalVideoPage.tsx",
      "utf8",
    );

    expect(prefetchedSlot).toContain("posterUrl?: string");
    expect(prefetchedSlot).toContain(
      'useVideoFrameReady(videoRef, posterUrl ?? "")',
    );
    expect(invitationHero).toContain(
      "posterUrl={invitation.videoPoster}",
    );
    expect(invitationView).toContain("poster={invitation.videoPoster}");
    expect(invitationView).toContain(
      "videoPoster={invitation.videoPoster}",
    );
    expect(externalVideo).toContain("<VideoPosterLayer");
    expect(externalVideo).toContain("poster={videoPoster}");
  });

  it("uses presented-frame readiness in curtain and entrance heroes", () => {
    const curtainBackground = readFileSync(
      "components/curtain-canva/CurtainHeroVideo.tsx",
      "utf8",
    );
    const curtainHero = readFileSync(
      "components/curtain-canva/CurtainsHero.tsx",
      "utf8",
    );
    const entranceHero = readFileSync(
      "components/video-entrance/VideoEntranceHero.tsx",
      "utf8",
    );

    for (const source of [curtainBackground, curtainHero, entranceHero]) {
      expect(source).toContain("<VideoPosterLayer");
      expect(source).toContain("useVideoFrameReady(");
      expect(source).not.toContain(
        "const [videoReady, setVideoReady] = useState(false)",
      );
      expect(source).not.toContain("handleVideoPlaying");
    }
    expect(curtainBackground).toContain("poster={videoPoster}");
    expect(curtainHero).toContain("poster={curtainVideoPoster}");
    expect(entranceHero).toContain("poster={videoPoster}");
  });
});
