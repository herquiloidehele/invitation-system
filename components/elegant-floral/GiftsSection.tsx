"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import confetti from "canvas-confetti";
import type { GiftRegistry, TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { efStyle } from "@/lib/elegant-floral";
import { giftsPagePath, hasGiftItems } from "@/lib/gift-registry";
import { useRouter } from "@/i18n/routing";
import { EditableText } from "@/components/shared/EditableText";
import ScriptTitle from "./ScriptTitle";
import PillButton from "./PillButton";
import ConfettiAccordion from "./ConfettiAccordion";
import { efGroup, efItem, useRevealProps } from "./motion";

/** How long the celebratory confetti runs before navigating to the gift list. */
const GIFT_CONFETTI_MS = 1200;

interface GiftsSectionProps {
  giftRegistry: GiftRegistry;
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides | null;
  /** Invitation slug — used to build the internal gifts-page link. */
  slug: string;
  /** Personal guest token to preserve on the gifts-page link. */
  guestToken?: string;
  title?: string;
  /** Accordion bar label that reveals the gift message + button. */
  label?: string;
  buttonLabel?: string;
}

/** "Presentes" — an open-by-default bar with the gift message + "Ver Lista",
 *  which bursts confetti for a beat before opening the gift list. */
export default function GiftsSection({
  giftRegistry,
  theme,
  textStyles: ts,
  slug,
  guestToken,
  title = "Presentes",
  label = "Opção presentear",
  buttonLabel = "Ver Lista",
}: GiftsSectionProps) {
  const reveal = useRevealProps();
  const router = useRouter();
  const firingRef = useRef(false);

  const handleVerLista = useCallback(() => {
    if (firingRef.current) return;
    const href = giftsPagePath(slug, guestToken);
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      router.push(href);
      return;
    }
    firingRef.current = true;
    const colors = [theme.primary, theme.secondary, theme.accent, "#FFFFFF"];
    const end = Date.now() + GIFT_CONFETTI_MS;
    const frame = () => {
      confetti({
        particleCount: 10,
        spread: 55,
        startVelocity: 22,
        gravity: 1,
        scalar: 0.7,
        ticks: 130,
        origin: { x: 0.5, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    window.setTimeout(() => router.push(href), GIFT_CONFETTI_MS);
  }, [slug, guestToken, theme.primary, theme.secondary, theme.accent, router]);

  if (!giftRegistry?.enabled) return null;

  return (
    <motion.section
      id="gifts"
      style={{
        padding: "2rem clamp(1rem, 4.5vw, 1.75rem)",
        maxWidth: 520,
        marginInline: "auto",
      }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div variants={efItem}>
        <ScriptTitle
          theme={theme}
          textStyles={ts}
          style={{ marginBottom: "3rem" }}
        >
          {title}
        </ScriptTitle>
      </motion.div>

      <motion.div variants={efItem}>
        <ConfettiAccordion
          header={label}
          theme={theme}
          textStyles={ts}
          defaultOpen
          confettiOnOpen={false}
        >
          {giftRegistry.text && (
            <p
              style={efStyle(
                {
                  margin: "0.2rem 0 0",
                  textAlign: "center",
                  fontFamily: theme.bodyFont,
                  color: theme.textSecondary,
                  fontSize: "clamp(0.96rem, 3.7vw, 1.16rem)",
                  lineHeight: 1.6,
                },
                ts,
                "efBody",
              )}
            >
              <EditableText elementKey="efBody">
                {giftRegistry.text}
              </EditableText>
            </p>
          )}
          {hasGiftItems(giftRegistry) ? (
            <div style={{ marginTop: "1.3rem", textAlign: "center" }}>
              <PillButton
                onClick={handleVerLista}
                theme={theme}
                textStyles={ts}
                icon={<Gift size={16} strokeWidth={1.6} />}
              >
                {buttonLabel}
              </PillButton>
            </div>
          ) : giftRegistry.link ? (
            <div style={{ marginTop: "1.3rem", textAlign: "center" }}>
              <PillButton
                href={giftRegistry.link}
                theme={theme}
                textStyles={ts}
                icon={<Gift size={16} strokeWidth={1.6} />}
              >
                {buttonLabel}
              </PillButton>
            </div>
          ) : null}
        </ConfettiAccordion>
      </motion.div>
    </motion.section>
  );
}
