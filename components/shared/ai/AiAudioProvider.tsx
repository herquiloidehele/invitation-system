"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { shouldUseBackgroundAudio } from "@/lib/invitation-audio";
import { nextFadeVolume } from "@/lib/ai-audio";
import type { InvitationData } from "@/lib/types";
import { AiAudioContextProvider } from "./AiAudioContext";

const FADE_START = 0.03;
const FADE_STEP = 0.02;
const FADE_TARGET = 0.5;
const FADE_INTERVAL_MS = 200;

/**
 * Owns the invitation's background-audio element and the gesture-primed start.
 * Nested above AiCoverGate so the cover tap can call `start()` within the user
 * gesture (browser autoplay policy), and above the bundle so `useAudio()` can
 * read `{ playing, toggle }`.
 */
export default function AiAudioProvider({
  invitation,
  children,
}: {
  invitation: InvitationData;
  children: ReactNode;
}) {
  const enabled = shouldUseBackgroundAudio(
    invitation.invitationType,
    invitation.audio,
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);

  // Reflect the element's own play/pause events into state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [enabled]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (fadeRef.current) clearInterval(fadeRef.current);
    };
  }, []);

  const start = useCallback(() => {
    if (startedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    startedRef.current = true;
    audio.loop = true;
    audio.muted = false;
    audio.volume = FADE_START;
    audio
      .play()
      .then(() => {
        let vol = FADE_START;
        fadeRef.current = setInterval(() => {
          vol = nextFadeVolume(vol, FADE_STEP, FADE_TARGET);
          audio.volume = vol;
          if (vol >= FADE_TARGET && fadeRef.current) {
            clearInterval(fadeRef.current);
            fadeRef.current = null;
          }
        }, FADE_INTERVAL_MS);
      })
      .catch(() => {
        // Autoplay blocked (or no gesture) — allow a later toggle() to retry.
        startedRef.current = false;
      });
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.muted = false;
      if (audio.volume < FADE_TARGET) audio.volume = FADE_TARGET;
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  return (
    <AiAudioContextProvider value={{ ready: enabled, playing, start, toggle }}>
      {enabled ? (
        <audio
          ref={audioRef}
          src={invitation.audio.src}
          preload="auto"
          aria-hidden
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      ) : null}
      {children}
    </AiAudioContextProvider>
  );
}
