"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, UserPlus, Users } from "lucide-react";

import type { PublicGuestData, TemplateTheme } from "@/lib/types";
import InviteOthersModal from "./InviteOthersModal";

interface PersonalGuestCardProps {
  guest: PublicGuestData;
  theme: TemplateTheme;
}

export default function PersonalGuestCard({
  guest,
  theme,
}: PersonalGuestCardProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative px-6 pt-4 pb-8"
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
            style={{ color: theme.textMuted, fontFamily: theme.uiFont }}
          >
            — Convite Pessoal —
          </p>

          <h2
            className="mt-4 text-3xl leading-tight"
            style={{
              fontFamily: theme.displayFont,
              color: theme.textPrimary,
            }}
          >
            <p>{guest.name}</p>
            {guest.companion ? (
              <>
                <p className={"text-gray-500"}>&</p>
                <p>{guest.companion}</p>
              </>
            ) : (
              ""
            )}
          </h2>

          {(guest.tableLabel || guest.note) && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {guest.tableLabel && (
                <InfoPill
                  icon={<Users className="size-3.5" />}
                  label="Mesa"
                  value={guest.tableLabel}
                  theme={theme}
                />
              )}
              {guest.note && (
                <InfoPill
                  icon={<MessageCircle className="size-3.5" />}
                  label="Nota"
                  value={guest.note}
                  theme={theme}
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
              }}
            >
              <UserPlus className="size-3.5" />
              Convidar mais pessoas
            </button>
          )}
        </div>
      </motion.section>

      <InviteOthersModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        inviterToken={guest.token}
        theme={theme}
      />
    </>
  );
}

function InfoPill({
  icon,
  label,
  value,
  theme,
  multiline = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  theme: TemplateTheme;
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
          style={{ color: theme.textMuted, fontFamily: theme.uiFont }}
        >
          {label}
        </p>
        <p
          className="text-sm font-medium"
          style={{
            color: theme.textPrimary,
            fontFamily: theme.bodyFont,
            whiteSpace: multiline ? "pre-line" : "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
