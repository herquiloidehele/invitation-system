import type { AudioConfig, InvitationType } from "./types";

export function shouldUseBackgroundAudio(
  invitationType: InvitationType | undefined,
  audio: Pick<AudioConfig, "enabled" | "src">,
): boolean {
  const type = invitationType ?? "standard";
  return (
    (type === "standard" || type === "external_link") &&
    audio.enabled &&
    !!audio.src
  );
}
