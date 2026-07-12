"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { GiftItem, TemplateTheme } from "@/lib/types";

export type GiftReservationDialogMode = "choose" | "replace" | "release";

export default function GiftReservationDialog({
  mode,
  gift,
  theme,
  personalizedGuestName,
  pending,
  open,
  onOpenChange,
  onConfirm,
}: {
  mode: GiftReservationDialogMode;
  gift: GiftItem;
  theme: TemplateTheme;
  personalizedGuestName?: string;
  pending: boolean;
  open: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(guestName?: string): Promise<boolean>;
}) {
  const t = useTranslations("Invitation");
  const [guestName, setGuestName] = useState("");
  const [nameError, setNameError] = useState(false);
  const asksForName = mode === "choose" && !personalizedGuestName;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setGuestName("");
      setNameError(false);
    }
    onOpenChange(nextOpen);
  }

  const title =
    mode === "release"
      ? t("gifts_releaseTitle")
      : mode === "replace"
        ? t("gifts_replaceTitle")
        : t("gifts_chooseTitle");
  const confirmLabel =
    mode === "release"
      ? t("gifts_confirmRelease")
      : mode === "replace"
        ? t("gifts_confirmReplace")
        : t("gifts_confirmChoose");

  async function confirm() {
    const normalizedName = guestName.trim();
    if (asksForName && !normalizedName) {
      setNameError(true);
      return;
    }
    const success = await onConfirm(asksForName ? normalizedName : undefined);
    if (success) handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        style={{
          background: theme.cardBg,
          color: theme.textPrimary,
          border: `1px solid ${theme.cardBorder}`,
          fontFamily: theme.bodyFont,
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{ fontFamily: theme.displayFont, color: theme.primary }}
          >
            {title}
          </DialogTitle>
          <DialogDescription style={{ color: theme.textSecondary }}>
            {gift.name}
            {personalizedGuestName ? ` · ${personalizedGuestName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {asksForName && (
          <label
            style={{ display: "grid", gap: 6, color: theme.textSecondary }}
          >
            <span>{t("gifts_publicNameLabel")}</span>
            <Input
              value={guestName}
              onChange={(event) => {
                setGuestName(event.target.value);
                setNameError(false);
              }}
              placeholder={t("gifts_publicNamePlaceholder")}
              aria-invalid={nameError}
              autoComplete="name"
              maxLength={120}
              disabled={pending}
            />
            {nameError && (
              <span
                role="alert"
                style={{ color: theme.textPrimary, fontSize: 12 }}
              >
                {t("gifts_nameRequired")}
              </span>
            )}
          </label>
        )}

        <DialogFooter style={{ background: `${theme.primary}0A` }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
            style={{
              borderColor: theme.ctaSecondaryBorder,
              color: theme.ctaSecondaryText,
              borderRadius: theme.ctaRadius,
            }}
          >
            {t("gifts_cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void confirm()}
            disabled={pending}
            style={{
              background: theme.ctaPrimaryBg,
              color: theme.ctaPrimaryText,
              borderRadius: theme.ctaRadius,
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
