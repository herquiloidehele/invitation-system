"use client";

import type { CSSProperties } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbStyle, mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import { EditableText } from "@/components/shared/EditableText";

/**
 * The `SÁBADO | 16 | MAIO 2026` line, split by hairline rules.
 *
 * Shared by the ceremony and reception blocks; `color` lets the reception
 * panel render it inverted without a second copy of the markup.
 */
export default function DateRow({
  invitation,
  theme,
  color,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  color?: string;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const fg = color ?? theme.textPrimary;
  const { dayOfWeek, day, month, year } = invitation.date;

  const base: CSSProperties = {
    fontFamily: theme.bodyFont,
    fontWeight: 300,
    color: fg,
    lineHeight: 1.1,
  };

  const divider: CSSProperties = {
    width: 1,
    height: 34,
    backgroundColor: color
      ? mixWithTransparent(color, 40)
      : mixWithTransparent(theme.primary, 40),
  };

  return (
    <div style={{ marginTop: t.gap.row }}>
      {/* Reference layout: weekday | day | month on one rule-separated line,
          with the year centred beneath it. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <span
          style={mbStyle(
            { ...base, fontSize: 12, textTransform: "uppercase" },
            ts,
            "mbDateMonth",
          )}
        >
          <EditableText elementKey="mbDateMonth">{dayOfWeek}</EditableText>
        </span>

        <span aria-hidden style={divider} />

        <span style={mbStyle({ ...base, fontSize: 30 }, ts, "mbDateDay")}>
          <EditableText elementKey="mbDateDay">{day}</EditableText>
        </span>

        <span aria-hidden style={divider} />

        <span
          style={mbStyle(
            { ...base, fontSize: 12, textTransform: "uppercase" },
            ts,
            "mbDateMonth",
          )}
        >
          <EditableText elementKey="mbDateMonth">{month}</EditableText>
        </span>
      </div>

      <p
        style={mbStyle(
          { ...base, fontSize: 18, textAlign: "center", margin: "10px 0 0" },
          ts,
          "mbDateYear",
        )}
      >
        <EditableText elementKey="mbDateYear">{year}</EditableText>
      </p>
    </div>
  );
}
