"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import type { AudioConfig, TemplateTheme } from "@/lib/types";
import { EditableText } from "./EditableText";

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------

interface AudioPlayerTheme {
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
  /** Resolved CSSProperties for the song title */
  titleStyle?: CSSProperties;
  /** Resolved CSSProperties for the artist name */
  artistStyle?: CSSProperties;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Public entry — narrows the props union into the flat-props implementation.
 *  Hook-free on purpose: the ref prop must only flow through JSX here, never
 *  into render-scope expressions (react-hooks/refs). */
export default function AudioPlayer(props: AudioPlayerProps) {
  if ("audio" in props) {
    return (
      <AudioPlayerImpl
        src={props.audio.src}
        title={props.audio.title}
        artist={props.audio.artist}
        theme={derivePlayerTheme(props.theme)}
        externalAudioRef={props.externalAudioRef}
        onPlay={props.onPlay}
      />
    );
  }
  return <AudioPlayerImpl {...props} />;
}

function AudioPlayerImpl({
  src,
  title,
  artist,
  theme: playerTheme,
  titleStyle,
  artistStyle,
  externalAudioRef,
  onPlay,
}: DirectProps) {
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Create our own Audio element only when there's no external ref.
  // (externalAudioRef must only be inspected inside effects/handlers, never
  // during render; as a stable ref object it never retriggers the effect.)
  useEffect(() => {
    if (externalAudioRef) return;

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
  }, [src, externalAudioRef]);

  // Sync playing state with external audio (it may already be playing)
  useEffect(() => {
    const audio = externalAudioRef?.current;
    if (!audio) return;

    // Check initial state — the envelope may have already started playback
    // before this component mounted, so the play/pause listeners below would
    // never fire for it. useSyncExternalStore is no alternative: its
    // getSnapshot runs during render and may not read the ref.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initial sync with an already-playing external element
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
  }, [externalAudioRef]);

  // Helper to get the active audio element — the internal ref is only ever
  // populated when no external ref was given, so external wins when present.
  const getAudio = useCallback((): HTMLAudioElement | null => {
    return externalAudioRef?.current ?? internalAudioRef.current;
  }, [externalAudioRef]);

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
  }, [isPlaying, getAudio, onPlay]);

  // Fallback styles when no resolved text styles are provided
  const defaultTitleStyle: CSSProperties = {
    color: playerTheme.titleColor,
    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
  };
  const defaultArtistStyle: CSSProperties = {
    color: playerTheme.artistColor,
    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
  };

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
        <EditableText elementKey="audioTitle">
          <span
            className="truncate text-sm font-medium leading-tight"
            style={titleStyle ?? defaultTitleStyle}
          >
            {title}
          </span>
        </EditableText>
        <EditableText elementKey="audioArtist">
          <span
            className="truncate text-xs leading-tight"
            style={artistStyle ?? defaultArtistStyle}
          >
            {artist}
          </span>
        </EditableText>
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
