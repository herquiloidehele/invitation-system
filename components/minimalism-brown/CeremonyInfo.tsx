"use client";

import type { CSSProperties } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { mbStyle, mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import { useCustomText } from "@/lib/custom-texts";
import { isWeddingEventType } from "@/lib/invitation-event-types";
import { EditableText } from "@/components/shared/EditableText";
import SectionTitle from "./SectionTitle";
import DateRow from "./DateRow";
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
      {father && <p style={nameStyle}>{father}</p>}
      {mother && <p style={nameStyle}>{mother}</p>}
    </RevealItem>
  );
}

/**
 * Ceremony block: both sets of parents, the announcement of the couple, and
 * the ceremony venue / time / date.
 *
 * Each sub-block is independently optional. With `parents` disabled the
 * section collapses to the announcement and date rather than leaving an empty
 * frame behind.
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
  // Non-wedding events have a single honouree; the role captions ("O Noivo" /
  // "A Noiva") and the second name don't apply.
  const isWedding = isWeddingEventType(invitation.eventType);
  const showParents =
    parents?.enabled &&
    (parents.bridesFather ||
      parents.bridesMother ||
      parents.groomsFather ||
      parents.groomsMother);

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
  const roleCaption: CSSProperties = {
    margin: 0,
    fontFamily: t.eyebrow.font,
    fontSize: 10,
    fontWeight: 300,
    letterSpacing: `${t.eyebrow.tracking}px`,
    textTransform: "uppercase",
    color: theme.textSecondary,
  };

  return (
    <Reveal as="section" style={{ marginTop: t.gap.section }}>
      <SectionCard theme={theme} radius={13}>
      <SectionTitle theme={theme} textStyles={ts}>
        {ct("sectionTitle_ceremonyInfo")}
      </SectionTitle>

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

      {parents?.inviteMessage && (
        <p
          style={{
            ...mbStyle(announce, ts, "mbAnnounce"),
            marginTop: t.gap.section / 2,
            textTransform: "uppercase",
            paddingInline: 12,
          }}
        >
          <EditableText elementKey="mbAnnounce">
            {parents.inviteMessage}
          </EditableText>
        </p>
      )}

      <div style={{ textAlign: "center", marginTop: t.gap.block }}>
        <p style={mbStyle(bigName, ts, "mbNames")}>
          <EditableText elementKey="mbNames">
            {invitation.couple.groom}
          </EditableText>
        </p>
        {isWedding && (
          <p style={mbStyle(roleCaption, ts, "mbRoleCaption")}>
            <EditableText elementKey="mbRoleCaption">
              {ct("mb_groomCaption")}
            </EditableText>
          </p>
        )}

        {isWedding && (
          <>
            <p
              aria-hidden
              style={{
                margin: `${t.gap.row}px 0`,
                fontFamily: theme.scriptFont ?? theme.displayFont,
                fontSize: 35,
                lineHeight: 1,
                color: theme.textPrimary,
              }}
            >
              &amp;
            </p>

            <p style={mbStyle(bigName, ts, "mbNames")}>
              <EditableText elementKey="mbNames">
                {invitation.couple.bride}
              </EditableText>
            </p>
            <p style={mbStyle(roleCaption, ts, "mbRoleCaption")}>
              <EditableText elementKey="mbRoleCaption">
                {ct("mb_brideCaption")}
              </EditableText>
            </p>
          </>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: t.gap.section / 2 }}>
        <p
          style={mbStyle(
            {
              margin: 0,
              fontFamily: theme.bodyFont,
              fontSize: 16,
              fontWeight: 400,
              color: theme.textSecondary,
            },
            ts,
            "mbVenueLine",
          )}
        >
          <EditableText elementKey="mbVenueLine">
            {invitation.location.name}
          </EditableText>
        </p>

        {invitation.date.time && (
          <p
            style={{
              margin: `${t.gap.row}px 0 0`,
              fontFamily: theme.bodyFont,
              fontSize: 16,
              color: theme.textSecondary,
            }}
          >
            {ct("mb_ceremonyAt")}{" "}
            <span
              style={mbStyle(
                {
                  fontSize: 20,
                  fontWeight: 300,
                  color: theme.textPrimary,
                },
                ts,
                "mbTimeValue",
              )}
            >
              <EditableText elementKey="mbTimeValue">
                {invitation.date.time}
              </EditableText>
            </span>
          </p>
        )}

        <DateRow invitation={invitation} theme={theme} />
      </div>
      </SectionCard>
    </Reveal>
  );
}
