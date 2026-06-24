"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronLeft, ExternalLink, Gift } from "lucide-react";

import { Link } from "@/i18n/routing";
import { useCustomText } from "@/lib/custom-texts";
import type { GiftItem, InvitationData, TemplateTheme } from "@/lib/types";

interface GiftsListViewProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  slug: string;
  guestToken?: string;
}

const CARD_RADIUS = 16;

const group: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function GiftsListView({
  invitation,
  theme,
  slug,
  guestToken,
}: GiftsListViewProps) {
  const reduceMotion = useReducedMotion();
  const t = useTranslations("Invitation");
  const ct = useCustomText(invitation.customTexts);

  const items = invitation.giftRegistry.items ?? [];
  const title = ct("sectionTitle_giftRegistry");
  const message = invitation.giftRegistry.text?.trim();
  const scriptFont = theme.scriptFont ?? theme.displayFont;
  const backHref = `/${slug}${
    guestToken ? `?g=${encodeURIComponent(guestToken)}` : ""
  }`;

  const reveal = reduceMotion
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: theme.bg,
        backgroundImage: theme.bgGradient || undefined,
        color: theme.textPrimary,
        fontFamily: theme.bodyFont,
        padding: "clamp(1rem, 4vw, 2rem) clamp(1rem, 4.5vw, 1.75rem) 3rem",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: theme.textSecondary,
            fontFamily: theme.uiFont,
            fontSize: 13,
            letterSpacing: "0.04em",
            textDecoration: "none",
          }}
        >
          <ChevronLeft size={16} strokeWidth={1.6} />
          {t("gifts_backToInvitation")}
        </Link>

        <header style={{ textAlign: "center", margin: "1.75rem 0 2rem" }}>
          {invitation.couple.monogram && (
            <div
              style={{
                fontFamily: scriptFont,
                color: theme.monogramColor,
                fontSize: 22,
                marginBottom: 10,
              }}
            >
              {invitation.couple.monogram}
            </div>
          )}
          <div
            style={{
              color: theme.primary,
              fontFamily: theme.uiFont,
              fontSize: 11,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {t("gifts_eyebrow")}
          </div>
          <h1
            style={{
              fontFamily: scriptFont,
              color: theme.primary,
              fontSize: "clamp(2.4rem, 10vw, 3.4rem)",
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {title}
          </h1>
          <div
            style={{
              width: 64,
              height: 1,
              background: theme.decorativeColor,
              margin: "14px auto 0",
            }}
          />
          {message && (
            <p
              style={{
                color: theme.textSecondary,
                fontSize: "clamp(0.96rem, 3.6vw, 1.1rem)",
                lineHeight: 1.6,
                maxWidth: 520,
                margin: "16px auto 0",
                whiteSpace: "pre-line",
              }}
            >
              {message}
            </p>
          )}
        </header>

        <motion.ul
          variants={reduceMotion ? undefined : group}
          {...reveal}
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 14,
          }}
        >
          {items.map((gift) => (
            <motion.li key={gift.id} variants={reduceMotion ? undefined : card}>
              <GiftCard gift={gift} theme={theme} />
            </motion.li>
          ))}
        </motion.ul>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link
            href={backHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 26px",
              borderRadius: 9999,
              border: `1px solid ${theme.ctaSecondaryBorder}`,
              color: theme.ctaSecondaryText,
              fontFamily: theme.uiFont,
              fontSize: 13,
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} strokeWidth={1.6} />
            {t("gifts_backToInvitation")}
          </Link>
        </div>
      </div>
    </main>
  );
}

function GiftCard({ gift, theme }: { gift: GiftItem; theme: TemplateTheme }) {
  const cardStyle: CSSProperties = {
    display: "block",
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    height: "100%",
  };

  const inner = (
    <>
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          background: `${theme.primary}14`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {gift.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gift.imageUrl}
            alt={gift.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <Gift size={30} strokeWidth={1.4} color={theme.primary} />
        )}
        {gift.link && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ExternalLink size={13} strokeWidth={1.6} color={theme.primary} />
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px 13px" }}>
        <div
          style={{
            fontFamily: theme.bodyFont,
            color: theme.textPrimary,
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {gift.name}
        </div>
        {gift.price?.trim() && (
          <div
            style={{
              fontFamily: theme.uiFont,
              color: theme.primary,
              fontSize: 13,
              marginTop: 3,
            }}
          >
            {gift.price}
          </div>
        )}
      </div>
    </>
  );

  if (gift.link) {
    return (
      <a
        href={gift.link}
        target="_blank"
        rel="noopener noreferrer"
        style={cardStyle}
        aria-label={gift.name}
      >
        {inner}
      </a>
    );
  }
  return <div style={cardStyle}>{inner}</div>;
}
