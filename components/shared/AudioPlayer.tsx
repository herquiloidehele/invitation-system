"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MutableRefObject,
} from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import type { AudioConfig, TemplateTheme } from "@/lib/types";

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------

export interface AudioPlayerTheme {
  bgColor: string;
  playBtnColor: string;
  playIconColor: string;
  titleColor: string;
  artistColor: string;
}

/** Derive player-specific colors from a full TemplateTheme. */
function derivePlayerTheme(t: TemplateTheme): AudioPlayerTheme {
  return {
    bgColor: t.cardBg === "transparent" ? "rgba(255,255,255,0.85)" : t.cardBg,
    playBtnColor: t.accent,
    playIconColor: t.ctaPrimaryText,
    titleColor: t.textPrimary,
    artistColor: t.textSecondary,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DirectProps {
  src: string;
  title: string;
  artist: string;
  theme: AudioPlayerTheme;
  /** Optional external audio ref — when provided the player uses this
   *  already-playing Audio element instead of creating its own. */
  externalAudioRef?: MutableRefObject<HTMLAudioElement | null>;
  onPlay?: () => void;
}

interface IntegrationProps {
  audio: AudioConfig;
  theme: TemplateTheme;
  externalAudioRef?: MutableRefObject<HTMLAudioElement | null>;
  onPlay?: () => void;
}

type AudioPlayerProps = DirectProps | IntegrationProps;

function isIntegrationProps(p: AudioPlayerProps): p is IntegrationProps {
  return "audio" in p;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AudioPlayer(props: AudioPlayerProps) {
  const src = isIntegrationProps(props) ? props.audio.src : props.src;
  const title = isIntegrationProps(props) ? props.audio.title : props.title;
  const artist = isIntegrationProps(props) ? props.audio.artist : props.artist;
  const playerTheme = isIntegrationProps(props)
    ? derivePlayerTheme(props.theme)
    : props.theme;
  const externalAudioRef = props.externalAudioRef;
  const onPlay = props.onPlay;

  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // -----------------------------------------------------------------------
  // Determine whether we own the audio element or an external one was given
  // -----------------------------------------------------------------------
  const hasExternal = !!externalAudioRef;

  // Create our own Audio element only when there's no external ref
  useEffect(() => {
    if (hasExternal) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "metadata";
    internalAudioRef.current = audio;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, [src, hasExternal]);

  // Sync playing state with external audio (it may already be playing)
  useEffect(() => {
    if (!hasExternal) return;
    const audio = externalAudioRef?.current;
    if (!audio) return;

    // Check initial state — the envelope already started playback
    setIsPlaying(!audio.paused);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [hasExternal, externalAudioRef]);

  // Helper to get the active audio element
  const getAudio = useCallback((): HTMLAudioElement | null => {
    if (hasExternal) return externalAudioRef?.current ?? null;
    return internalAudioRef.current;
  }, [hasExternal, externalAudioRef]);

  const togglePlay = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlay?.();
        })
        .catch(() => {
          // Browser may block autoplay; user interaction required
          setIsPlaying(false);
        });
    }
  }, [isPlaying, getAudio]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-full px-4 py-2 shadow-lg"
      style={{
        backgroundColor: playerTheme.bgColor,
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
        style={{ backgroundColor: playerTheme.playBtnColor }}
      >
        {isPlaying ? (
          <Pause
            size={18}
            fill={playerTheme.playIconColor}
            color={playerTheme.playIconColor}
          />
        ) : (
          <Play
            size={18}
            fill={playerTheme.playIconColor}
            color={playerTheme.playIconColor}
          />
        )}
      </button>

      <div className="flex min-w-0 flex-col pr-1">
        <span
          className="truncate text-sm font-medium leading-tight"
          style={{
            color: playerTheme.titleColor,
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
          }}
        >
          {title}
        </span>
        <span
          className="truncate text-xs leading-tight"
          style={{
            color: playerTheme.artistColor,
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
          }}
        >
          {artist}
        </span>
      </div>

      {/* Animated equalizer bars — visible when playing */}
      <div
        className="flex items-end gap-[3px] pl-1"
        style={{
          height: 18,
          opacity: isPlaying ? 1 : 0.3,
          transition: "opacity 0.3s ease",
        }}
        aria-hidden
      >
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="w-[3px] rounded-full"
            style={{
              backgroundColor: playerTheme.playBtnColor,
              height: isPlaying ? "100%" : 4,
              animation: isPlaying
                ? `eq-bar-${n} 0.8s ease-in-out infinite`
                : "none",
              transition: "height 0.3s ease",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
