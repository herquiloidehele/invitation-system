"use client";

import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { CSSProperties } from "react";
import type { CustomTexts, TemplateTheme } from "@/lib/types";
import { useCustomText } from "@/lib/custom-texts";

export type RsvpResultKind =
  | "success"
  | "error"
  | "already_submitted"
  | "deadline";

interface Props {
  kind: RsvpResultKind;
  theme: TemplateTheme;
  customTexts?: CustomTexts;
  deadline?: string;
  onRetry?: () => void;
}

export default function RsvpResultState({
  kind,
  theme,
  customTexts,
  deadline,
  onRetry,
}: Props) {
  const t = useCustomText(customTexts);

  const titleStyle: CSSProperties = {
    fontFamily: theme.displayFont,
    color: theme.textPrimary,
  };
  const bodyStyle: CSSProperties = {
    fontFamily: theme.bodyFont,
    color: theme.textSecondary,
  };

  if (kind === "deadline") {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <Clock size={44} strokeWidth={1.3} style={{ color: theme.textMuted }} />
        <p className="text-lg font-medium" style={titleStyle}>
          {t("rsvp_deadlineClosedTitle")}
        </p>
        <p className="text-sm" style={bodyStyle}>
          {t("rsvp_deadlineClosedMessage", {
            deadline: deadline
              ? t("rsvp_deadlineDatePrefix", { deadline })
              : "",
          })}
        </p>
      </div>
    );
  }

  if (kind === "already_submitted") {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <CheckCircle
          size={44}
          strokeWidth={1.3}
          style={{ color: theme.accent }}
        />
        <p className="text-lg font-medium" style={titleStyle}>
          {t("rsvp_alreadyTitle")}
        </p>
        <p className="text-sm" style={bodyStyle}>
          {t("rsvp_alreadyMessage")}
        </p>
      </div>
    );
  }

  if (kind === "success") {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <CheckCircle
          size={44}
          strokeWidth={1.3}
          style={{ color: theme.accent }}
        />
        <p className="text-lg font-medium" style={titleStyle}>
          {t("rsvp_successTitle")}
        </p>
        <p className="text-sm" style={bodyStyle}>
          {t("rsvp_successMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <AlertCircle size={44} strokeWidth={1.3} color="#ef4444" />
      <p className="text-lg font-medium" style={titleStyle}>
        {t("rsvp_errorTitle")}
      </p>
      <p className="text-sm" style={bodyStyle}>
        {t("rsvp_errorMessage")}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: theme.ctaPrimaryBg,
            color: theme.ctaPrimaryText,
            borderRadius: theme.ctaRadius,
            fontFamily: theme.uiFont,
          }}
        >
          {t("rsvp_retryButton")}
        </button>
      )}
    </div>
  );
}
