"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Gift } from "lucide-react";
import confetti from "canvas-confetti";
import type { GiftRegistry, TemplateTheme, TextStyleOverrides } from "@/lib/types";
import { efStyle } from "@/lib/elegant-floral";
import { giftsPagePath, hasBankTransfer, hasGiftItems } from "@/lib/gift-registry";
import { useRouter } from "@/i18n/routing";
import { EditableText } from "@/components/shared/EditableText";
import ScriptTitle from "./ScriptTitle";
import PillButton from "./PillButton";
import ConfettiAccordion from "./ConfettiAccordion";
import { efGroup, efItem, useRevealProps } from "./motion";

/** How long the celebratory confetti runs before navigating to the gift list. */
const GIFT_CONFETTI_MS = 1200;

/** A bank-detail value with a small button that copies it, flashing a check ~1.5s. */
function CopyableValue({
  value,
  theme,
}: {
  value: string;
  theme: TemplateTheme;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      // Fallback for in-app webviews without the async clipboard API.
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copiar"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        padding: "0.35rem 0.65rem",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        background: `color-mix(in srgb, ${theme.secondary} 18%, transparent)`,
        color: theme.primary,
        fontFamily: theme.uiFont,
        fontSize: "0.78rem",
        lineHeight: 1,
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

interface GiftsSectionProps {
  giftRegistry: GiftRegistry;
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides | null;
  /** Invitation slug — used to build the internal gifts-page link. */
  slug: string;
  /** Personal guest token to preserve on the gifts-page link. */
  guestToken?: string;
  title?: string;
  /** Header for the registry sub-accordion. */
  label?: string;
  buttonLabel?: string;
  /** Header for the bank-transfer sub-accordion. */
  bankLabel?: string;
}

/** "Presentes" — a card with the gift message on top and up to two confetti
 *  sub-accordions: the registry "Ver Lista" option and a bank-transfer option. */
export default function GiftsSection({
  giftRegistry,
  theme,
  textStyles: ts,
  slug,
  guestToken,
  title = "Presentes",
  label = "Lista de Presentes",
  buttonLabel = "Ver Lista",
  bankLabel = "Transferência Bancária",
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

  const showRegistry = hasGiftItems(giftRegistry) || Boolean(giftRegistry.link);
  const showBank = hasBankTransfer(giftRegistry);

  const messageStyle = efStyle(
    {
      margin: 0,
      textAlign: "center",
      fontFamily: theme.bodyFont,
      color: theme.textSecondary,
      fontSize: "clamp(0.96rem, 3.7vw, 1.16rem)",
      lineHeight: 1.6,
      whiteSpace: "pre-line",
    },
    ts,
    "efBody",
  );

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

      <motion.div
        variants={efItem}
        style={{
          borderRadius: 16,
          padding: "1.5rem clamp(1rem, 4vw, 1.5rem)",
          background: `color-mix(in srgb, ${theme.secondary} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${theme.secondary} 18%, transparent)`,
        }}
      >
        {giftRegistry.text && (
          <p style={messageStyle}>
            <EditableText elementKey="efBody">{giftRegistry.text}</EditableText>
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.7rem",
            marginTop: giftRegistry.text ? "1.5rem" : 0,
          }}
        >
          {showRegistry && (
            <ConfettiAccordion header={label} theme={theme} textStyles={ts}>
              <div style={{ marginTop: "0.4rem", textAlign: "center" }}>
                {hasGiftItems(giftRegistry) ? (
                  <PillButton
                    onClick={handleVerLista}
                    theme={theme}
                    textStyles={ts}
                    icon={<Gift size={16} strokeWidth={1.6} />}
                  >
                    {buttonLabel}
                  </PillButton>
                ) : (
                  <PillButton
                    href={giftRegistry.link}
                    theme={theme}
                    textStyles={ts}
                    icon={<Gift size={16} strokeWidth={1.6} />}
                  >
                    {buttonLabel}
                  </PillButton>
                )}
              </div>
            </ConfettiAccordion>
          )}

          {showBank && (
            <ConfettiAccordion header={bankLabel} theme={theme} textStyles={ts}>
              {giftRegistry.bankTransferText && (
                <p
                  style={efStyle(
                    {
                      margin: "0.2rem 0 1rem",
                      fontFamily: theme.bodyFont,
                      color: theme.textSecondary,
                      fontSize: "clamp(0.9rem, 3.4vw, 1.05rem)",
                      lineHeight: 1.55,
                      whiteSpace: "pre-line",
                    },
                    ts,
                    "efBody",
                  )}
                >
                  {giftRegistry.bankTransferText}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.8rem",
                }}
              >
                {giftRegistry.bankTransfer
                  ?.filter((row) => row.value?.trim())
                  .map((row) => (
                    <div
                      key={row.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 16,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        {row.label?.trim() && (
                          <div
                            style={{
                              fontFamily: theme.uiFont,
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              color: theme.textPrimary,
                            }}
                          >
                            {row.label}
                          </div>
                        )}
                        <div
                          style={{
                            fontFamily: theme.uiFont,
                            fontSize: "0.8rem",
                            color: theme.textSecondary,
                            wordBreak: "break-word",
                          }}
                        >
                          {row.value}
                        </div>
                      </div>
                      {row.copyable && (
                        <CopyableValue value={row.value} theme={theme} />
                      )}
                    </div>
                  ))}
              </div>
            </ConfettiAccordion>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}
