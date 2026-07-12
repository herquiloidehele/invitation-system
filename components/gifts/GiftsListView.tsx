"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, ChevronLeft, ExternalLink, Gift, LockKeyhole } from "lucide-react";

import GiftReservationDialog, { type GiftReservationDialogMode } from "@/components/gifts/GiftReservationDialog";
import { useGiftReservations } from "@/components/gifts/useGiftReservations";
import { Link } from "@/i18n/routing";
import { useCustomText } from "@/lib/custom-texts";
import {
  type GiftAvailability,
  type GiftAvailabilityStatus,
  resolveGiftCardState
} from "@/lib/gift-reservation-domain";
import type { GiftItem, InvitationData, TemplateTheme } from "@/lib/types";

interface GiftsListViewProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  slug: string;
  guestToken?: string;
  initialAvailability?: GiftAvailability[];
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
  initialAvailability,
}: GiftsListViewProps) {
  const reduceMotion = useReducedMotion();
  const t = useTranslations("Invitation");
  const ct = useCustomText(invitation.customTexts);
  const exclusive = invitation.giftRegistry.exclusiveSelectionEnabled === true;
  const reservation = useGiftReservations({
    slug,
    guestToken,
    initialAvailability: initialAvailability ?? [],
  });
  const [dialogGift, setDialogGift] = useState<GiftItem | null>(null);
  const [dialogMode, setDialogMode] =
    useState<GiftReservationDialogMode>("choose");
  const [dialogOpen, setDialogOpen] = useState(false);

  const items = invitation.giftRegistry.items ?? [];
  const title = ct("sectionTitle_giftRegistry");
  const message = invitation.giftRegistry.text?.trim();
  const scriptFont = theme.scriptFont ?? theme.displayFont;
  const availabilityById = useMemo(
    () =>
      new Map(reservation.availability.map((item) => [item.giftItemId, item])),
    [reservation.availability],
  );
  const hasOwnedGift = reservation.availability.some(
    (item) => item.status === "owned",
  );
  const backHref = `/${slug}?section=gifts${
    guestToken ? `&g=${encodeURIComponent(guestToken)}` : ""
  }`;

  const reveal = reduceMotion
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const };

  function openChooseDialog(gift: GiftItem) {
    setDialogGift(gift);
    setDialogMode(hasOwnedGift ? "replace" : "choose");
    setDialogOpen(true);
  }

  function openReleaseDialog(gift: GiftItem) {
    setDialogGift(gift);
    setDialogMode("release");
    setDialogOpen(true);
  }

  async function confirmReservation(guestName?: string) {
    if (!dialogGift) return false;
    return dialogMode === "release"
      ? reservation.release()
      : reservation.choose(dialogGift.id, guestName);
  }

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

        {exclusive && reservation.error && (
          <p
            aria-live="polite"
            role="status"
            style={{
              maxWidth: 560,
              margin: "0 auto 14px",
              color: theme.textPrimary,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            {reservation.error === "conflict"
              ? t("gifts_conflict")
              : t("gifts_requestError")}
          </p>
        )}

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
              <GiftCard
                gift={gift}
                theme={theme}
                state={
                  exclusive
                    ? resolveGiftCardState(availabilityById.get(gift.id))
                    : undefined
                }
                pending={reservation.pending}
                labels={{
                  choose: t("gifts_choose"),
                  alreadyChosen: t("gifts_alreadyChosen"),
                  yourGift: t("gifts_yourGift"),
                  viewInStore: t("gifts_viewInStore"),
                  release: t("gifts_release"),
                  loading: t("gifts_loading"),
                }}
                onChoose={() => openChooseDialog(gift)}
                onRelease={() => openReleaseDialog(gift)}
              />
            </motion.li>
          ))}
        </motion.ul>

        {dialogGift && (
          <GiftReservationDialog
            mode={dialogMode}
            gift={dialogGift}
            theme={theme}
            personalizedGuestName={invitation.guest?.name}
            pending={reservation.pending}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onConfirm={confirmReservation}
          />
        )}

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

type GiftCardState = GiftAvailabilityStatus | "loading";

type GiftCardLabels = {
  choose: string;
  alreadyChosen: string;
  yourGift: string;
  viewInStore: string;
  release: string;
  loading: string;
};

function GiftCard({
  gift,
  theme,
  state,
  pending,
  labels,
  onChoose,
  onRelease,
}: {
  gift: GiftItem;
  theme: TemplateTheme;
  state?: GiftCardState;
  pending: boolean;
  labels: GiftCardLabels;
  onChoose(): void;
  onRelease(): void;
}) {
  const cardStyle: CSSProperties = {
    display: "block",
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    height: "100%",
    opacity: state === "reserved" ? 0.58 : 1,
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
        {gift.link && (!state || state === "owned") && (
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
        {state && (
          <GiftCardReservationActions
            gift={gift}
            theme={theme}
            state={state}
            pending={pending}
            labels={labels}
            onChoose={onChoose}
            onRelease={onRelease}
          />
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

function GiftCardReservationActions({
  gift,
  theme,
  state,
  pending,
  labels,
  onChoose,
  onRelease,
}: {
  gift: GiftItem;
  theme: TemplateTheme;
  state: GiftCardState;
  pending: boolean;
  labels: GiftCardLabels;
  onChoose(): void;
  onRelease(): void;
}) {
  const statusStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
    color: state === "owned" ? theme.primary : theme.textMuted,
    fontFamily: theme.uiFont,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };
  const actionStyle: CSSProperties = {
    width: "100%",
    marginTop: 9,
    padding: "8px 10px",
    borderRadius: theme.ctaRadius,
    fontFamily: theme.uiFont,
    fontSize: 12,
    fontWeight: 600,
    cursor: pending ? "wait" : "pointer",
  };

  if (state === "loading") {
    return <div style={statusStyle}>{labels.loading}</div>;
  }
  if (state === "reserved") {
    return (
      <div style={statusStyle} aria-label={labels.alreadyChosen}>
        <LockKeyhole size={12} />
        {labels.alreadyChosen}
      </div>
    );
  }
  if (state === "available") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={(event) => {
          event.preventDefault();
          onChoose();
        }}
        style={{
          ...actionStyle,
          border: "none",
          background: theme.ctaPrimaryBg,
          color: theme.ctaPrimaryText,
        }}
      >
        {labels.choose}
      </button>
    );
  }

  return (
    <div>
      <div style={statusStyle}>
        <Check size={13} />
        {labels.yourGift}
      </div>
      {gift.link && (
        <a
          href={gift.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...actionStyle,
            display: "block",
            boxSizing: "border-box",
            textAlign: "center",
            textDecoration: "none",
            border: `1px solid ${theme.ctaSecondaryBorder}`,
            color: theme.ctaSecondaryText,
          }}
        >
          {labels.viewInStore}
        </a>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={(event) => {
          event.preventDefault();
          onRelease();
        }}
        style={{
          ...actionStyle,
          border: "none",
          background: "transparent",
          color: theme.textSecondary,
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        {labels.release}
      </button>
    </div>
  );
}
