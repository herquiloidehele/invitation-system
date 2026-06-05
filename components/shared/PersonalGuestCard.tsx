"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { MessageCircle, UserPlus, Users } from "lucide-react";

import type {
  CustomTexts,
  PublicGuestData,
  TemplateTheme,
  TextStyleOverrides,
} from "@/lib/types";
import { resolveTextElementOverride } from "@/lib/curtain-canva";
import { useCustomText } from "@/lib/custom-texts";
import InviteOthersModal from "./InviteOthersModal";
import { EditableText } from "./EditableText";

interface PersonalGuestCardProps {
  guest: PublicGuestData;
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides;
  customTexts?: CustomTexts;
}

/**
 * Preview-only sample guest so the card renders in the admin editor, where
 * there is no real per-recipient guest data. This object is never persisted.
 */
export const PREVIEW_SAMPLE_GUEST: PublicGuestData = {
  token: "preview-sample",
  name: "Maria",
  companion: "João",
  tableLabel: "Mesa 5",
  note: "Mal podemos esperar para celebrar com você!",
  canInviteOthers: true,
  invitationSlug: "preview",
};

export default function PersonalGuestCard({
  guest,
  theme,
  textStyles,
  customTexts,
}: PersonalGuestCardProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const t = useCustomText(customTexts);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative px-6 pt-12 pb-0"
        style={{ zIndex: 2 }}
      >
        <div
          className="mx-auto max-w-md rounded-3xl border px-6 py-8 text-center backdrop-blur-sm"
          style={{
            background: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{
              color: theme.textMuted,
              fontFamily: theme.uiFont,
              ...resolveTextElementOverride(textStyles, "guestCardLabel"),
            }}
          >
            <EditableText elementKey="guestCardLabel">
              {t("guestCard_label")}
            </EditableText>
          </p>

          <h2
            className="mt-4 text-3xl leading-tight"
            style={{
              fontFamily: theme.displayFont,
              color: theme.textPrimary,
              ...resolveTextElementOverride(textStyles, "guestCardName"),
            }}
          >
            <p>
              <EditableText elementKey="guestCardName">
                {guest.name}
              </EditableText>
            </p>
            {guest.companion ? (
              <div
                style={resolveTextElementOverride(
                  textStyles,
                  "guestCardCompanion",
                )}
              >
                <p
                  style={{
                    color: "#6b7280",
                    ...resolveTextElementOverride(
                      textStyles,
                      "guestCardCompanion",
                    ),
                  }}
                >
                  <EditableText elementKey="guestCardCompanion">&</EditableText>
                </p>
                <p>
                  <EditableText elementKey="guestCardCompanion">
                    {guest.companion}
                  </EditableText>
                </p>
              </div>
            ) : (
              ""
            )}
          </h2>

          {(guest.tableLabel || guest.note) && (
            <div className="mt-6 grid grid-cols-1 gap-3">
              {guest.tableLabel && (
                <InfoPill
                  icon={<Users className="size-3.5" />}
                  label={t("guestCard_tableLabel")}
                  value={guest.tableLabel}
                  theme={theme}
                  textStyles={textStyles}
                />
              )}
              {guest.note && (
                <InfoPill
                  icon={<MessageCircle className="size-3.5" />}
                  label={t("guestCard_noteLabel")}
                  value={guest.note}
                  theme={theme}
                  textStyles={textStyles}
                  multiline
                />
              )}
            </div>
          )}

          {guest.canInviteOthers && (
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs uppercase tracking-widest transition-colors hover:opacity-80"
              style={{
                borderColor: theme.ctaSecondaryBorder,
                color: theme.ctaSecondaryText,
                fontFamily: theme.uiFont,
                borderRadius: theme.ctaRadius,
                ...resolveTextElementOverride(
                  textStyles,
                  "guestCardInviteButton",
                ),
              }}
            >
              <UserPlus className="size-3.5" />
              <EditableText elementKey="guestCardInviteButton">
                {t("guestCard_inviteButton")}
              </EditableText>
            </button>
          )}
        </div>
      </motion.section>

      <InviteOthersModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        inviterToken={guest.token}
        theme={theme}
        customTexts={customTexts}
      />
    </>
  );
}

function InfoPill({
  icon,
  label,
  value,
  theme,
  textStyles,
  multiline = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  theme: TemplateTheme;
  textStyles?: TextStyleOverrides;
  multiline?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-left"
      style={{
        borderColor: theme.cardBorder,
        background: "rgba(255,255,255,0.4)",
      }}
    >
      <span style={{ color: theme.accent }} className="mt-0.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-[9px] uppercase tracking-widest"
          style={{
            color: theme.textMuted,
            fontFamily: theme.uiFont,
            ...resolveTextElementOverride(textStyles, "guestCardPillLabel"),
          }}
        >
          <EditableText elementKey="guestCardPillLabel">{label}</EditableText>
        </p>
        <p
          className="text-sm font-medium"
          style={{
            color: theme.textPrimary,
            fontFamily: theme.bodyFont,
            whiteSpace: multiline ? "pre-line" : "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            ...resolveTextElementOverride(textStyles, "guestCardPillValue"),
          }}
        >
          <EditableText elementKey="guestCardPillValue">{value}</EditableText>
        </p>
      </div>
    </div>
  );
}
