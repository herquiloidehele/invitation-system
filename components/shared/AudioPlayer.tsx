"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
}

interface IntegrationProps {
  audio: AudioConfig;
  theme: TemplateTheme;
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Browser may block autoplay; user interaction required
          setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-full px-4 py-2 shadow-lg backdrop-blur-md"
      style={{ backgroundColor: playerTheme.bgColor }}
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
          style={{ color: playerTheme.titleColor }}
        >
          {title}
        </span>
        <span
          className="truncate text-xs leading-tight"
          style={{ color: playerTheme.artistColor }}
        >
          {artist}
        </span>
      </div>
    </motion.div>
  );
}
