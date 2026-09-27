"use client";

import type { CSSProperties } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import {
  mbBlessingLine,
  mbCoupleNames,
  mbParentsShown,
  mbStyle,
  mbTokens,
  mixWithTransparent,
} from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import { EditableText } from "@/components/shared/EditableText";
import SectionTitle from "./SectionTitle";
import SectionCard from "./SectionCard";
import { Reveal, RevealGroup, RevealItem } from "./motion";

/** One family's block in the parents grid. Declared at module scope so it
 *  isn't recreated (and remounted) on every render of the section. */
function ParentColumn({
  father,
  mother,
  labelStyle,
  nameStyle,
}: {
  father?: string;
  mother?: string;
  labelStyle: CSSProperties;
  nameStyle: CSSProperties;
}) {
  return (
    <RevealItem style={{ flex: 1, textAlign: "center" }}>
      <p style={labelStyle}>
        <EditableText elementKey="mbParentLabel">Sr. &amp; Sra.</EditableText>
      </p>
      {father && (
        <p style={nameStyle}>
          <EditableText elementKey="mbParentName">{father}</EditableText>
        </p>
      )}
      {mother && (
        <p style={nameStyle}>
          <EditableText elementKey="mbParentName">{mother}</EditableText>
        </p>
      )}
    </RevealItem>
  );
}

/**
 * The opening announcement, in the order Portuguese invitations use:
 * blessing → parents' names → the couple on one line → the invite message.
 *
 * Parents mode drives it. On, the blessing is the parents' own line ("Com a
 * bênção de Deus e seus pais"). Off, the parents' names drop out and the
 * blessing falls back to the section title ("Com a bênção de Deus"), so the
 * couple read as the ones inviting.
 */
export default function CeremonyInfo({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const ct = useCustomText(invitation.customTexts);
  const parents = invitation.parents;
  const showParents = mbParentsShown(parents);
  const blessing = mbBlessingLine(parents, ct("sectionTitle_ceremonyInfo"));
  const [firstName, secondName] = mbCoupleNames(invitation);
  const inviteMessage = parents?.inviteMessage?.trim();

  const parentLabel: CSSProperties = {
    margin: 0,
    fontFamily: theme.bodyFont,
    fontSize: 12,
    fontWeight: 300,
    color: theme.textSecondary,
  };
  const parentName: CSSProperties = {
    margin: 0,
    fontFamily: theme.bodyFont,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.7,
    color: theme.textPrimary,
  };
  const announce: CSSProperties = {
    margin: 0,
    textAlign: "center",
    fontFamily: theme.bodyFont,
    fontSize: 12,
    fontWeight: 300,
    lineHeight: 1.8,
    color: theme.textPrimary,
  };
  const bigName: CSSProperties = {
    margin: 0,
    fontFamily: theme.displayFont,
    fontSize: 33,
    fontWeight: 400,
    lineHeight: 1.15,
    color: theme.textPrimary,
  };

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section }}>
      <SectionCard theme={theme} radius={13}>
        {blessing && (
          <SectionTitle theme={theme} textStyles={ts}>
            {blessing}
          </SectionTitle>
        )}

        {showParents && (
          <RevealGroup
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginTop: t.gap.block,
            }}
          >
            <ParentColumn
              father={parents?.bridesFather}
              mother={parents?.bridesMother}
              labelStyle={mbStyle(parentLabel, ts, "mbParentLabel")}
              nameStyle={mbStyle(parentName, ts, "mbParentName")}
            />
            <span
              aria-hidden
              style={{
                width: 1,
                alignSelf: "stretch",
                backgroundColor: mixWithTransparent(theme.primary, 22),
              }}
            />
            <ParentColumn
              father={parents?.groomsFather}
              mother={parents?.groomsMother}
              labelStyle={mbStyle(parentLabel, ts, "mbParentLabel")}
              nameStyle={mbStyle(parentName, ts, "mbParentName")}
            />
          </RevealGroup>
        )}

        {/* The couple on one line; long names wrap at the ampersand. Styled
            under their own key so they never move with the hero's names. */}
        <p
          style={{
            margin: `${showParents ? t.gap.section / 2 : t.gap.block}px 0 0`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            columnGap: 10,
            textAlign: "center",
          }}
        >
          <span style={mbStyle(bigName, ts, "mbAnnounceNames")}>
            <EditableText elementKey="mbAnnounceNames">{firstName}</EditableText>
          </span>
          {secondName !== undefined && (
            <>
              <span
                aria-hidden
                style={mbStyle(
                  {
                    fontFamily: theme.scriptFont ?? theme.displayFont,
                    fontSize: 35,
                    lineHeight: 1,
                    color: theme.textPrimary,
                  },
                  ts,
                  "mbAnnounceAmp",
                )}
              >
                <EditableText elementKey="mbAnnounceAmp">&amp;</EditableText>
              </span>
              <span style={mbStyle(bigName, ts, "mbAnnounceNames")}>
                <EditableText elementKey="mbAnnounceNames">{secondName}</EditableText>
              </span>
            </>
          )}
        </p>

        {inviteMessage && (
          <p
            style={{
              ...mbStyle(announce, ts, "mbAnnounce"),
              marginTop: t.gap.block - 4,
              textTransform: "uppercase",
              paddingInline: 12,
            }}
          >
            <EditableText elementKey="mbAnnounce">{inviteMessage}</EditableText>
          </p>
        )}
      </SectionCard>
    </Reveal>
  );
}
