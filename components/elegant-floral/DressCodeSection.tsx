"use client";

import { motion } from "framer-motion";
import type { DressCode, TemplateTheme } from "@/lib/types";
import ScriptTitle from "./ScriptTitle";
import HeartDivider from "./HeartDivider";
import { efGroup, efItem, efPop, useRevealProps } from "./motion";

interface DressCodeSectionProps {
  dressCode: DressCode;
  theme: TemplateTheme;
  title?: string;
  noteTitle?: string;
}

const SIDE_PAD = "clamp(1.5rem, 7vw, 3rem)";

/** Dress code: title/intro, ladies palette + gowns art, gentlemen + suits art, reserved note. */
export default function DressCodeSection({
  dressCode,
  theme,
  title = "Dress Code",
  noteTitle = "Nota",
}: DressCodeSectionProps) {
  const reveal = useRevealProps();
  if (!dressCode?.enabled) return null;
  const { ladies, gentlemen } = dressCode;

  const labelStyle = {
    fontFamily: theme.displayFont,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: theme.secondary,
    fontSize: "clamp(0.92rem, 3.8vw, 1.1rem)",
    margin: "1.9rem 0 0.5rem",
  };
  const noteStyle = {
    fontFamily: theme.bodyFont,
    color: theme.textSecondary,
    fontSize: "clamp(0.96rem, 3.7vw, 1.16rem)",
    margin: 0,
    lineHeight: 1.55,
  };
  const figureStyle = {
    display: "block",
    width: "100%",
    margin: "1.1rem auto 0",
    mixBlendMode: "multiply" as const,
  };

  return (
    <motion.section
      style={{ textAlign: "center", padding: `2rem ${SIDE_PAD}`, maxWidth: 560, marginInline: "auto" }}
      variants={efGroup}
      {...reveal}
    >
      <motion.div variants={efItem}>
        <ScriptTitle theme={theme}>{title}</ScriptTitle>
      </motion.div>

      {dressCode.title && (
        <motion.p
          variants={efItem}
          style={{
            fontFamily: theme.displayFont,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: theme.primary,
            fontSize: "clamp(1rem, 4vw, 1.2rem)",
            margin: "1.2rem 0 0.3rem",
          }}
        >
          {dressCode.title}
        </motion.p>
      )}
      {dressCode.intro && (
        <motion.p variants={efItem} style={noteStyle}>
          {dressCode.intro}
        </motion.p>
      )}

      {ladies && (
        <motion.div variants={efItem}>
          {ladies.label && <p style={labelStyle}>{ladies.label}</p>}
          {ladies.note && <p style={noteStyle}>{ladies.note}</p>}
          {ladies.palette && ladies.palette.length > 0 && (
            <motion.div
              variants={efGroup}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "0.45rem 1rem",
                maxWidth: 440,
                margin: "0.8rem auto 0",
              }}
            >
              {ladies.palette.map((c, i) => (
                <motion.span
                  key={`${c.name}-${i}`}
                  variants={efPop}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: theme.bodyFont,
                    color: theme.textSecondary,
                    fontSize: "clamp(0.88rem, 3.4vw, 1.02rem)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 9999,
                      background: theme.secondary,
                      flexShrink: 0,
                    }}
                  />
                  {c.name}
                </motion.span>
              ))}
            </motion.div>
          )}
          {ladies.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ladies.imageUrl} alt="Vestidos" style={{ ...figureStyle, maxWidth: 300 }} />
          )}
        </motion.div>
      )}

      {gentlemen && (
        <motion.div variants={efItem}>
          {gentlemen.label && <p style={labelStyle}>{gentlemen.label}</p>}
          {gentlemen.note && <p style={noteStyle}>{gentlemen.note}</p>}
          {gentlemen.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gentlemen.imageUrl} alt="Fatos" style={{ ...figureStyle, maxWidth: 230 }} />
          )}
        </motion.div>
      )}

      {dressCode.reservedNote && (
        <motion.div variants={efItem} style={{ marginTop: "2.1rem" }}>
          <ScriptTitle theme={theme} as="h3" size="clamp(1.4rem, 6vw, 1.85rem)">
            {noteTitle}
          </ScriptTitle>
          <p style={{ ...noteStyle, maxWidth: 440, margin: "0.6rem auto 0" }}>
            {dressCode.reservedNote}
          </p>
        </motion.div>
      )}

      <motion.div variants={efItem}>
        <HeartDivider color={theme.secondary} style={{ marginTop: "2.1rem" }} />
      </motion.div>
    </motion.section>
  );
}
