"use client";

import { motion } from "framer-motion";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import HeartDivider from "./HeartDivider";
import { efGroup, efItem, efNames, useRevealProps } from "./motion";

interface AnnouncementProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

const SIDE_PAD = "clamp(1.75rem, 8vw, 3.5rem)";

/** Parents announcement → couple names (script) → date, staggered into view. */
export default function Announcement({ invitation, theme }: AnnouncementProps) {
  const reveal = useRevealProps();
  const { parents, couple, date, eventType } = invitation;
  const names =
    eventType === "wedding" ? `${couple.bride} e ${couple.groom}` : couple.bride;

  const join = (a?: string, b?: string) =>
    [a, b].filter((s) => s && s.trim()).join("  •  ");
  const brideParents = parents
    ? join(parents.bridesFather, parents.bridesMother)
    : "";
  const groomParents = parents
    ? join(parents.groomsFather, parents.groomsMother)
    : "";

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
      {parents?.enabled && (brideParents || groomParents) && (
        <motion.div
          variants={efItem}
          style={{ fontSize: "clamp(1rem, 4vw, 1.25rem)", lineHeight: 1.5 }}
        >
          {brideParents && <p style={{ margin: 0 }}>{brideParents}</p>}
          {brideParents && groomParents && (
            <p style={{ margin: "0.2em 0", color: theme.textMuted }}>e</p>
          )}
          {groomParents && <p style={{ margin: 0 }}>{groomParents}</p>}
        </motion.div>
      )}

      {parents?.inviteMessage && (
        <motion.p
          variants={efItem}
          style={{ margin: "1.35rem 0 0", fontSize: "clamp(0.98rem, 3.8vw, 1.2rem)" }}
        >
          {parents.inviteMessage}
        </motion.p>
      )}

      <motion.h1
        variants={efNames}
        style={{
          margin: "0.3rem 0",
          fontFamily: theme.scriptFont ?? theme.displayFont,
          fontWeight: 400,
          fontSize: "clamp(2.3rem, 11vw, 3.9rem)",
          lineHeight: 1.05,
          color: theme.primary,
        }}
      >
        {names}
      </motion.h1>

      <motion.p
        variants={efItem}
        style={{ margin: "1rem 0 0.35rem", fontSize: "clamp(0.95rem, 3.6vw, 1.15rem)" }}
      >
        A realizar-se no dia
      </motion.p>
      <motion.p
        variants={efItem}
        style={{
          margin: 0,
          fontFamily: theme.displayFont,
          fontWeight: 600,
          fontSize: "clamp(1.45rem, 6vw, 2rem)",
          color: theme.secondary,
        }}
      >
        {date.display}
      </motion.p>
      {(date.dayOfWeek || date.time) && (
        <motion.p
          variants={efItem}
          style={{
            margin: "0.35rem 0 0",
            color: theme.textMuted,
            fontSize: "clamp(0.85rem, 3.2vw, 1.05rem)",
          }}
        >
          {[date.dayOfWeek, date.time].filter(Boolean).join(", ")}
        </motion.p>
      )}

      <motion.div variants={efItem} style={{ marginTop: "1.9rem" }}>
        <HeartDivider color={theme.secondary} />
      </motion.div>
    </motion.section>
  );
}
