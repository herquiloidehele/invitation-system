"use client";

import { motion } from "framer-motion";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import { efStyle } from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";
import FloralDivider from "./FloralDivider";
import { efGroup, efItem, efNames, useRevealProps } from "./motion";

interface AnnouncementProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

const SIDE_PAD = "clamp(1rem, 5vw, 2rem)";

/** Parents announcement → couple names (script) → date, staggered into view. */
export default function Announcement({ invitation, theme }: AnnouncementProps) {
  const reveal = useRevealProps();
  const ts = invitation.textStyles;
  const { parents, couple, date, eventType } = invitation;
  const names =
    eventType === "wedding"
      ? `${couple.bride} e ${couple.groom}`
      : couple.bride;

  const namesOf = (a?: string, b?: string) =>
    [a, b].map((s) => s?.trim()).filter((s): s is string => Boolean(s));
  const brideParents = parents
    ? namesOf(parents.bridesFather, parents.bridesMother)
    : [];
  const groomParents = parents
    ? namesOf(parents.groomsFather, parents.groomsMother)
    : [];

  return (
    <motion.section
      style={{
        textAlign: "center",
        padding: `1.25rem ${SIDE_PAD} 0`,
        color: theme.textSecondary,
        fontFamily: theme.bodyFont,
      }}
      variants={efGroup}
      {...reveal}
    >
      {parents?.enabled &&
        (brideParents.length > 0 || groomParents.length > 0) && (
          <motion.div
            variants={efItem}
            style={{ fontSize: "clamp(1rem, 4vw, 1.25rem)", lineHeight: 1.5 }}
          >
            {/* Parent names + "e" divider are each their own selectable
                element so the admin can (a) actually see the selection outline
                and (b) style the names and the "e" independently. Wrapping the
                whole block in one inline <span> broke the outline because a
                span can't render a box around block-level <p> children. */}
            {brideParents.map((name, i) => (
              <p
                key={`bride-${i}`}
                style={efStyle({ margin: 0 }, ts, "efParents")}
              >
                <EditableText elementKey="efParents">{name}</EditableText>
              </p>
            ))}
            {brideParents.length > 0 && groomParents.length > 0 && (
              <p
                style={efStyle(
                  { margin: "0.2em 0", color: theme.textMuted },
                  ts,
                  "efParentsDivider",
                )}
              >
                <EditableText elementKey="efParentsDivider">e</EditableText>
              </p>
            )}
            {groomParents.map((name, i) => (
              <p
                key={`groom-${i}`}
                style={efStyle({ margin: 0 }, ts, "efParents")}
              >
                <EditableText elementKey="efParents">{name}</EditableText>
              </p>
            ))}
          </motion.div>
        )}

      {parents?.inviteMessage && (
        <motion.p
          variants={efItem}
          style={efStyle(
            {
              margin: "1.35rem 0 0",
              fontSize: "clamp(0.98rem, 3.8vw, 1.2rem)",
            },
            ts,
            "efInviteMessage",
          )}
        >
          <EditableText elementKey="efInviteMessage">
            {parents.inviteMessage}
          </EditableText>
        </motion.p>
      )}

      <motion.h1
        variants={efNames}
        style={efStyle(
          {
            margin: "2rem 0",
            fontFamily: theme.scriptFont ?? theme.displayFont,
            fontWeight: 400,
            fontSize: "clamp(2.3rem, 11vw, 3.9rem)",
            lineHeight: 1.05,
            color: theme.primary,
          },
          ts,
          "efNames",
        )}
      >
        <EditableText elementKey="efNames">{names}</EditableText>
      </motion.h1>

      <motion.p
        variants={efItem}
        style={efStyle(
          {
            margin: "1rem 0 0.35rem",
            fontSize: "clamp(0.95rem, 3.6vw, 1.15rem)",
          },
          ts,
          "efDateLabel",
        )}
      >
        <EditableText elementKey="efDateLabel">
          A realizar-se no dia
        </EditableText>
      </motion.p>
      <motion.p
        variants={efItem}
        style={efStyle(
          {
            margin: 0,
            fontFamily: theme.displayFont,
            fontWeight: 600,
            fontSize: "clamp(1.45rem, 6vw, 2rem)",
            color: theme.secondary,
          },
          ts,
          "efDate",
        )}
      >
        <EditableText elementKey="efDate">{date.display}</EditableText>
      </motion.p>
      {(date.dayOfWeek || date.time) && (
        <motion.p
          variants={efItem}
          style={efStyle(
            {
              margin: "0.35rem 0 0",
              color: theme.textMuted,
              fontSize: "clamp(0.85rem, 3.2vw, 1.05rem)",
            },
            ts,
            "efDateTime",
          )}
        >
          <EditableText elementKey="efDateTime">
            {[date.dayOfWeek, date.time].filter(Boolean).join(", ")}
          </EditableText>
        </motion.p>
      )}

      <motion.div variants={efItem} style={{ marginTop: "1.9rem" }}>
        <FloralDivider primary={theme.primary} secondary={theme.secondary} />
      </motion.div>
    </motion.section>
  );
}
