import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import HeroVideoMutedField from "@/components/admin/HeroVideoMutedField";
import CurtainHeroVideo from "@/components/curtain-canva/CurtainHeroVideo";
import InvitationHero from "@/components/shared/InvitationHero";
import VideoEntranceHero from "@/components/video-entrance/VideoEntranceHero";
import { applyPrefetchedHeroVideoMuted } from "@/components/shared/PrefetchedVideoSlot";
import {
  playHeroVideo,
  primeHeroVideoPlayback,
  resolveHeroVideoMuted,
} from "@/lib/hero-video-audio";
import type { TemplateTheme } from "@/lib/types";
import { toInvitationData } from "@/lib/invitations";
import {
  duplicateForm,
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";
import pt from "../messages/pt.json";

const theme = sourceTheme as unknown as TemplateTheme;
type TestIntlProviderProps = Omit<
  ComponentProps<typeof NextIntlClientProvider>,
  "children"
> & { children?: ReactNode };
const TestIntlProvider =
  NextIntlClientProvider as ComponentType<TestIntlProviderProps>;

function renderWithIntl(element: ReactElement): string {
  return renderToStaticMarkup(
    createElement(
      TestIntlProvider,
      { locale: "pt", messages: pt, timeZone: "Europe/Lisbon" },
      element,
    ),
  );
}

function videoTag(html: string): string {
  return html.match(/<video\b[^>]*>/)?.[0] ?? "";
}

describe("resolveHeroVideoMuted", () => {
  it("keeps missing legacy values muted", () => {
    expect(resolveHeroVideoMuted()).toBe(true);
    expect(resolveHeroVideoMuted(null)).toBe(true);
  });

  it("preserves an explicit administrator choice", () => {
    expect(resolveHeroVideoMuted(true)).toBe(true);
    expect(resolveHeroVideoMuted(false)).toBe(false);
  });
});

describe("public invitation mapping", () => {
  it("preserves an explicit unmuted setting from the database row", () => {
    const invitation = toInvitationData(sourceInvitationRow);

    expect(invitation.heroVideoMuted).toBe(false);
  });
});

describe("HeroVideoMutedField", () => {
  it("renders legacy values as muted with an accessible label", () => {
    const html = renderToStaticMarkup(
      createElement(HeroVideoMutedField, {
        id: "heroVideoMutedTest",
        value: undefined,
        onChange: () => undefined,
      }),
    );

    expect(html).toContain('for="heroVideoMutedTest"');
    expect(html).toContain("Vídeo sem som");
    expect(html).toContain('aria-checked="true"');
  });

  it("renders an explicit unmuted choice as unchecked", () => {
    const html = renderToStaticMarkup(
      createElement(HeroVideoMutedField, {
        id: "heroVideoUnmutedTest",
        value: false,
        onChange: () => undefined,
      }),
    );

    expect(html).toContain('aria-checked="false"');
  });
});

describe("hero video rendering", () => {
  it("renders the standard hero unmuted only for an explicit false", () => {
    const unmuted = renderWithIntl(
      createElement(InvitationHero, {
        invitation: duplicateForm({ heroVideoMuted: false }),
        theme,
      }),
    );
    const muted = renderWithIntl(
      createElement(InvitationHero, {
        invitation: duplicateForm({ heroVideoMuted: undefined }),
        theme,
      }),
    );

    expect(videoTag(unmuted)).not.toContain("muted");
    expect(videoTag(muted)).toContain("muted");
  });

  it("renders the curtain background with the requested mute state", () => {
    const unmuted = renderToStaticMarkup(
      createElement(CurtainHeroVideo, {
        videoUrl: "https://cdn.example.com/hero.mp4",
        backgroundColor: "#ffffff",
        muted: false,
      }),
    );
    const muted = renderToStaticMarkup(
      createElement(CurtainHeroVideo, {
        videoUrl: "https://cdn.example.com/hero.mp4",
        backgroundColor: "#ffffff",
      }),
    );

    expect(videoTag(unmuted)).not.toContain("muted");
    expect(videoTag(muted)).toContain("muted");
  });

  it("renders a tapped video-entrance hero with the stored preference", () => {
    const invitation = duplicateForm({ heroVideoMuted: false });
    const html = renderWithIntl(
      createElement(VideoEntranceHero, {
        invitation,
        couple: invitation.couple,
        quote: invitation.quote,
        theme,
        audioRef: { current: null },
        videoUrl: invitation.videoUrl,
        videoPoster: invitation.videoPoster,
        eventType: invitation.eventType,
      }),
    );

    expect(videoTag(html)).not.toContain("muted");
  });

  it("updates an adopted prefetched element to the requested state", () => {
    const video = { muted: true } as HTMLVideoElement;

    applyPrefetchedHeroVideoMuted(video, false);

    expect(video.muted).toBe(false);
  });

  it("does not silently mute when playback is rejected", async () => {
    const video = {
      muted: false,
      play: () => Promise.reject(new Error("autoplay rejected")),
    } as HTMLVideoElement;

    await expect(playHeroVideo(video)).resolves.toBeUndefined();
    expect(video.muted).toBe(false);
  });

  it("primes an unmuted video during the cover tap and resets it", async () => {
    const events: string[] = [];
    const video = {
      muted: false,
      currentTime: 12,
      play: async () => {
        events.push("play");
      },
      pause: () => {
        events.push("pause");
      },
    };

    await primeHeroVideoPlayback(video);

    expect(events).toEqual(["play", "pause"]);
    expect(video.currentTime).toBe(0);
  });
});
