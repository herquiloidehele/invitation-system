"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import {
  countdownPartsFrom,
  efStyle,
  type CountdownParts,
} from "@/lib/elegant-floral";
import { EditableText } from "@/components/shared/EditableText";
import ScriptTitle from "./ScriptTitle";
import { efGroup, efItem, efPop, useRevealProps } from "./motion";

interface CountdownProps {
  invitation: InvitationData;
  theme: TemplateTheme;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Minimal "DD : HH : MM : SS" countdown matching the Canva, popped in on scroll. */
export default function Countdown({ invitation, theme }: CountdownProps) {
  const reveal = useRevealProps();
  const ts = invitation.textStyles;
  const config = invitation.countdown;
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const tick = () =>
      setParts(countdownPartsFrom(invitation.date.iso, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [invitation.date.iso]);

  if (!config?.enabled) return null;

  const p = parts ?? { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
  const cells = [
    { value: pad(p.days), label: config.daysLabel || "DIAS" },
    { value: pad(p.hours), label: config.hoursLabel || "HORAS" },
    { value: pad(p.minutes), label: config.minutesLabel || "MINUTOS" },
    { value: pad(p.seconds), label: config.secondsLabel || "SEGUNDOS" },
  ];

  const numberBase = {
    fontFamily: theme.displayFont,
    fontWeight: 600,
    fontSize: "clamp(1.7rem, 9vw, 2.5rem)",
    color: theme.primary,
    lineHeight: 1,
  } as const;
  const labelBase = {
    fontFamily: theme.uiFont,
    fontSize: "clamp(0.56rem, 2.2vw, 0.7rem)",
    letterSpacing: "0.12em",
    color: theme.textMuted,
  } as const;

  const numStyle = efStyle(numberBase, ts, "efCountdownValue");
  const colonStyle = efStyle(
    { ...numberBase, color: theme.secondary },
    ts,
    "efCountdownValue",
  );
  const labStyle = efStyle(labelBase, ts, "efCountdownLabel");

  const row1: ReactNode[] = [];
  const row2: ReactNode[] = [];
  cells.forEach((c, i) => {
    row1.push(
      <motion.span key={`num-${i}`} variants={efPop} style={numStyle}>
        <EditableText elementKey="efCountdownValue">{c.value}</EditableText>
      </motion.span>,
    );
    row2.push(
      <motion.span key={`lab-${i}`} variants={efPop} style={labStyle}>
        <EditableText elementKey="efCountdownLabel">{c.label}</EditableText>
      </motion.span>,
    );
    if (i < cells.length - 1) {
      row1.push(
        <motion.span key={`col-${i}`} variants={efPop} style={colonStyle}>
          :
        </motion.span>,
      );
      row2.push(<span key={`gap-${i}`} aria-hidden />);
    }
  });

  return (
    <motion.section
      style={{ textAlign: "center", padding: "2rem clamp(1.5rem, 6vw, 3rem)" }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div variants={efItem}>
        <ScriptTitle theme={theme} textStyles={ts} size="clamp(1.6rem, 6.8vw, 2.2rem)">
          {config.title || "Contagem Decrescente"}
        </ScriptTitle>
      </motion.div>

      <motion.div
        variants={efGroup}
        style={{
          display: "inline-grid",
          gridTemplateColumns: "repeat(7, auto)",
          columnGap: "clamp(0.25rem, 2vw, 0.9rem)",
          rowGap: "0.6rem",
          alignItems: "center",
          justifyItems: "center",
          marginTop: "1.5rem",
        }}
      >
        {row1}
        {row2}
      </motion.div>
    </motion.section>
  );
}
