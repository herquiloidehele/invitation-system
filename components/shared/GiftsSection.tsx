"use client";

import { type ReactNode, useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Gift, ExternalLink, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useRouter } from "@/i18n/routing";
import type { CustomTexts, GiftRegistry, TemplateTheme } from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import {
  giftsPagePath,
  hasBankTransfer,
  hasGiftItems,
} from "@/lib/gift-registry";
import { EASE } from "@/components/shared/animations";
import { EditableText } from "@/components/shared/EditableText";
import { useGiftConfettiNavigation } from "@/components/gifts/useGiftConfettiNavigation";
import { CopyableValue } from "@/components/gifts/CopyableValue";

interface CardStyle {
  cardBg: string;
  cardBorder: string;
  borderRadius: number;
  accentColor?: string;
}

interface GiftsSectionProps {
  giftRegistry: GiftRegistry;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  cardStyle: CardStyle;
  slug: string;
  guestToken?: string | null;
  locale: string;
  t: (key: keyof CustomTexts, values?: Record<string, string>) => string;
}

export default function GiftsSection({
  giftRegistry,
  theme,
  ts,
  cardStyle,
  slug,
  guestToken,
  locale,
  t,
}: GiftsSectionProps) {
  const router = useRouter();
  const { navigateToGifts } = useGiftConfettiNavigation(theme);

  const handleNavigate = useCallback(() => {
    const href =
      locale === DEFAULT_LOCALE
        ? giftsPagePath(slug, guestToken)
        : `/${locale}${giftsPagePath(slug, guestToken)}`;
    navigateToGifts(href, () => router.push(href));
  }, [slug, guestToken, locale, router, navigateToGifts]);

  const hasRegistry =
    hasGiftItems(giftRegistry) || Boolean(giftRegistry.link);
  const hasBank = hasBankTransfer(giftRegistry);

  return (
    <>
      <motion.div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: `${ts.accent}12` }}
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        <Gift size={20} color={ts.accent} strokeWidth={1.5} />
      </motion.div>

      <span style={ts.labels}>
        <EditableText elementKey="labels">
          {t("sectionTitle_giftRegistry")}
        </EditableText>
      </span>

      <span style={{ ...ts.giftText, whiteSpace: "pre-line" }}>
        <EditableText elementKey="giftText">
          {giftRegistry.text}
        </EditableText>
      </span>

      {(hasRegistry || hasBank) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: "100%",
            marginTop: 4,
          }}
        >
          {hasRegistry && (
            <GiftAccordion
              header="Lista de Presentes"
              theme={theme}
              cardStyle={cardStyle}
              accent={ts.accent}
            >
              <div className="flex justify-center mt-2">
                {hasGiftItems(giftRegistry) ? (
                  <button
                    type="button"
                    onClick={handleNavigate}
                    className="inline-flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                    style={{
                      fontFamily: theme.uiFont,
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      color: "#FFFFFF",
                      background: cardStyle.accentColor || ts.accent,
                      padding: "8px 24px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      boxShadow: `0 2px 6px ${cardStyle.accentColor || ts.accent}40`,
                    }}
                  >
                    <ArrowRight size={12} strokeWidth={1.5} />
                    <EditableText elementKey="giftLink">
                      {t("cta_giftLink")}
                    </EditableText>
                  </button>
                ) : (
                  <a
                    href={giftRegistry.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                    style={{
                      fontFamily: theme.uiFont,
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      color: "#FFFFFF",
                      background: cardStyle.accentColor || ts.accent,
                      padding: "8px 24px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                      boxShadow: `0 2px 6px ${cardStyle.accentColor || ts.accent}40`,
                    }}
                  >
                    <ExternalLink size={12} strokeWidth={1.5} />
                    <EditableText elementKey="giftLink">
                      {t("cta_giftLink")}
                    </EditableText>
                  </a>
                )}
              </div>
            </GiftAccordion>
          )}

          {hasBank && (
            <GiftAccordion
              header="Transferência Bancária"
              theme={theme}
              cardStyle={cardStyle}
              accent={ts.accent}
            >
              {giftRegistry.bankTransferText && (
                <p
                  style={{
                    margin: "0 0 0.75rem",
                    fontFamily: theme.bodyFont,
                    color: theme.textSecondary,
                    fontSize: "0.82rem",
                    lineHeight: 1.55,
                    whiteSpace: "pre-line",
                  }}
                >
                  {giftRegistry.bankTransferText}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                {giftRegistry.bankTransfer
                  ?.filter((row) => row.value?.trim())
                  .map((row) => (
                    <div
                      key={row.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {row.label?.trim() && (
                          <div
                            style={{
                              fontFamily: theme.uiFont,
                              fontWeight: 600,
                              fontSize: "0.78rem",
                              color: theme.textPrimary,
                            }}
                          >
                            {row.label}
                          </div>
                        )}
                        <div
                          style={{
                            fontFamily: theme.uiFont,
                            fontSize: "0.78rem",
                            color: theme.textSecondary,
                            wordBreak: "break-word",
                          }}
                        >
                          {row.value}
                        </div>
                      </div>
                      {row.copyable && (
                        <CopyableValue
                          value={row.value}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            flexShrink: 0,
                            padding: "0.3rem 0.6rem",
                            borderRadius: 6,
                            border: "none",
                            cursor: "pointer",
                            background: `${cardStyle.accentColor || ts.accent}14`,
                            color: cardStyle.accentColor || ts.accent,
                            fontFamily: theme.uiFont,
                            fontSize: "0.72rem",
                            lineHeight: 1,
                          }}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </GiftAccordion>
          )}
        </div>
      )}
    </>
  );
}

interface GiftAccordionProps {
  header: ReactNode;
  children: ReactNode;
  theme: TemplateTheme;
  cardStyle: CardStyle;
  accent: string;
}

function GiftAccordion({
  header,
  children,
  theme,
  cardStyle,
  accent,
}: GiftAccordionProps) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    const next = !open;
    if (next && headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 38,
        spread: 65,
        startVelocity: 26,
        gravity: 0.85,
        decay: 0.92,
        scalar: 0.85,
        ticks: 110,
        colors: [theme.primary, theme.secondary, accent, "#FFFFFF"],
        origin: { x, y },
        disableForReducedMotion: true,
      });
    }
    setOpen(next);
  };

  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${cardStyle.cardBorder}`,
        background: `${accent}06`,
      }}
    >
      <button
        ref={headerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "0.7rem 0.9rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: theme.uiFont,
          fontSize: "0.82rem",
          color: theme.textPrimary,
          lineHeight: 1.3,
        }}
      >
        <span style={{ fontWeight: 500 }}>{header}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ display: "inline-flex", flexShrink: 0, color: accent }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 0.9rem 0.8rem" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
