import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The hero video must not play while a cover is still covering it.
 *
 * A playing <video> downloads at full speed no matter what `preload` says, so
 * an invisible auto-playing hero steals bandwidth from the cover clip the guest
 * is actually waiting to tap — measured at ~9s of extra buffering on a Slow 4G
 * connection — and burns mobile data for guests who never open the invitation.
 */
describe("hero prefetch autoplay", () => {
  const slot = readFileSync("components/shared/PrefetchedVideoSlot.tsx", "utf8");
  const hero = readFileSync("components/shared/InvitationHero.tsx", "utf8");
  const rich = readFileSync("components/shared/RichExternalLinkPage.tsx", "utf8");
  const view = readFileSync("app/[locale]/[slug]/InvitationView.tsx", "utf8");

  it("gates playback on autoPlay instead of forcing it", () => {
    expect(slot).not.toContain("video.autoplay = true;");
    expect(slot).toContain("video.autoplay = autoPlay;");
    expect(slot).toContain("if (autoPlay) video.play()");
  });

  it("re-runs when autoPlay flips, so the handoff starts playback", () => {
    const deps = slot.slice(slot.indexOf("}, [videoRef"), slot.indexOf("}, [videoRef") + 80);
    expect(deps).toContain("autoPlay");
  });

  it("threads autoPlay from the hero into the prefetched slot", () => {
    // InvitationHero already accepted an `autoPlay` prop but only honoured it
    // on the non-prefetched branch, which made it dead on this path.
    expect(hero).toMatch(/<PrefetchedVideoSlot[\s\S]{0,260}autoPlay=\{autoPlay\}/);
  });

  it("lets the rich external-link page hold the hero back", () => {
    expect(rich).toContain("heroAutoPlay?: boolean;");
    expect(rich).toMatch(/<InvitationHero[\s\S]{0,300}autoPlay=\{heroAutoPlay\}/);
  });

  it("drives it from the same visibility signal as the hero text", () => {
    expect(view).toContain("heroAutoPlay={richExternalLinkVisible}");
  });

  it("keeps the hidden prefetch element at metadata until the tap", () => {
    // `upgradeHeroPreload` promotes it to "auto" inside the tap gesture.
    expect(view).toMatch(/ref=\{heroVideoRef\}[\s\S]{0,200}preload="metadata"/);
    expect(view).toContain('heroVideo.preload = "auto";');
  });
});
