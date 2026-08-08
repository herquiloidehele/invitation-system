/**
 * Resolve whether the hero video starts muted. Missing values come from
 * invitations created before the setting existed and retain the old behavior.
 */
export function resolveHeroVideoMuted(value?: boolean | null): boolean {
  return value !== false;
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
