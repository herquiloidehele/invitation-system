"use client";

import { createContext, useContext } from "react";

export interface AiAudioContextValue {
  /** True when a background-audio element exists to control. */
  ready: boolean;
  playing: boolean;
  /** Gesture-primed start (called by the cover tap). Idempotent. */
  start: () => void;
  /** Play/pause toggle for the bundle's control. */
  toggle: () => void;
}

/** Null when no AiAudioProvider is mounted (invitation has no background audio). */
const AiAudioContext = createContext<AiAudioContextValue | null>(null);

export const AiAudioContextProvider = AiAudioContext.Provider;

/** Read the audio context, or null when there is no background audio. */
export function useAiAudio(): AiAudioContextValue | null {
  return useContext(AiAudioContext);
}
