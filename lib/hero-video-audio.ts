/**
 * Resolve whether the hero video starts muted. Missing values come from
 * invitations created before the setting existed and retain the old behavior.
 */
export function resolveHeroVideoMuted(value?: boolean | null): boolean {
  return value !== false;
}

export interface HeroVideoPlaybackTarget {
  muted: boolean;
  currentTime: number;
  play: () => Promise<void>;
  pause: () => void;
}

/**
 * Give an unmuted hero video browser playback permission during the cover tap,
 * then return it to the first frame for the later cover-to-hero handoff.
 */
export async function primeHeroVideoPlayback(
  video: HeroVideoPlaybackTarget,
): Promise<void> {
  if (video.muted) return;

  try {
    await video.play();
    video.pause();
    video.currentTime = 0;
  } catch {
    // The reveal path will retain its existing playback fallback.
  }
}

/** Attempt playback without changing the administrator's chosen mute state. */
export async function playHeroVideo(
  video: Pick<HTMLVideoElement, "play">,
): Promise<void> {
  try {
    await video.play();
  } catch (error) {
    console.error("Failed to play the video", error);
    // Playback can be rejected by browser autoplay policy.
  }
}
