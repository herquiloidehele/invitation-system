"use client";

import type { AudioApi } from "@/lib/ai-audio-types";
import { useAiAudio } from "./AiAudioContext";

/**
 * `{ playing, ready, toggle }` for the invitation's background music. `ready` is
 * false when the invitation has no background audio. The gesture-primed start is
 * the cover's job (AiCoverGate); the bundle only offers a play/pause control.
 */
export function useAudio(): AudioApi {
  const audio = useAiAudio();
  if (!audio) {
    return { playing: false, ready: false, toggle: () => {} };
  }
  return { playing: audio.playing, ready: audio.ready, toggle: audio.toggle };
}
