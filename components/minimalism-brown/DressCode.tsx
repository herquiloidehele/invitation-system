"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import { EditableText } from "@/components/shared/EditableText";
import SectionTitle from "./SectionTitle";
import { Reveal, RevealGroup, RevealItem, mbPop } from "./motion";

/** Dress code: a line of guidance plus the palette swatches (1–6 colors). */
export default function DressCode({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  const ct = useCustomText(invitation.customTexts);
  const dress = invitation.dressCode;
  if (!dress?.enabled) return null;

  const colors = (dress.colors ?? []).filter((c) => c && c.trim());

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section, textAlign: "center" }}>
      <SectionTitle theme={theme} textStyles={invitation.textStyles}>
        {ct("sectionTitle_dressCode")}
      </SectionTitle>

      {dress.text && (
        <p
          style={{
            margin: `${t.gap.row}px 0 0`,
            fontFamily: t.title.font,
            fontSize: 14,
            fontWeight: 300,
            color: theme.textSecondary,
          }}
        >
          <EditableText elementKey="mbSectionTitle">{dress.text}</EditableText>
        </p>
      )}

      {colors.length > 0 && (
        <RevealGroup
          style={{
            marginTop: t.gap.block,
            display: "flex",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {colors.map((c, i) => (
            <RevealItem key={`${c}-${i}`} variant={mbPop}>
            <span
              title={c}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: c,
                border: `1px solid ${mixWithTransparent(theme.primary, 22)}`,
                display: "block",
              }}
            />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Reveal>
  );
}
