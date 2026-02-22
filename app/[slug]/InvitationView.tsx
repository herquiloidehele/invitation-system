"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { EnvelopeCoverAnimated } from "@/components/shared/EnvelopeCover";
import InvitationPage from "@/components/shared/InvitationPage";

interface InvitationViewProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

export default function InvitationView({
  invitation,
  theme,
}: InvitationViewProps) {
  const [isOpened, setIsOpened] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleOpen = useCallback(() => {
    setIsOpened(true);

    // Start audio playback on user interaction (satisfies browser autoplay policy)
    if (invitation.audio.enabled) {
      try {
        const audio = new Audio(invitation.audio.src);
        audio.loop = true;
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Autoplay blocked — AudioPlayer inside InvitationPage provides manual control
        });
        audioRef.current = audio;
      } catch {
        // Audio creation failed silently
      }
    }
  }, [invitation.audio]);

  return (
    <div
      className="min-h-dvh"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Envelope cover — animates out when opened */}
      <EnvelopeCoverAnimated
        isOpen={isOpened}
        monogram={invitation.couple.monogram}
        theme={theme}
        onOpen={handleOpen}
      />

      {/* Invitation content — fades in after cover exits */}
      <AnimatePresence>
        {isOpened && (
          <motion.div
            key="invitation-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <InvitationPage invitation={invitation} theme={theme} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
