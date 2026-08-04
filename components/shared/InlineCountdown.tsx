"use client";

import { Fragment, type CSSProperties } from "react";
import { motion } from "framer-motion";

import { EditableText } from "./EditableText";

interface InlineCountdownProps {
  values: readonly [string, string, string, string];
  labels: readonly [string, string, string, string];
  valueStyle: CSSProperties;
  labelStyle: CSSProperties;
  valueElementKey: string;
  labelElementKey: string;
  colonStyle?: CSSProperties;
  className?: string;
}

function CountdownColon({
  style,
  delay,
}: {
  style: CSSProperties;
  delay: number;
}) {
  return (
    <motion.span
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{
        duration: 1.6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      style={style}
    >
      :
    </motion.span>
  );
}

export default function InlineCountdown({
  values,
  labels,
  valueStyle,
  labelStyle,
  valueElementKey,
  labelElementKey,
  colonStyle,
  className,
}: InlineCountdownProps) {
  const baseClassName =
    "grid w-full max-w-[680px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-[clamp(0.125rem,1.5vw,0.75rem)]";
  const resolvedColonStyle: CSSProperties = {
    fontSize: 36,
    lineHeight: 1,
    marginTop: 10,
    ...colonStyle,
  };

  return (
    <div className={`${baseClassName}${className ? ` ${className}` : ""}`}>
      {values.map((value, index) => (
        <Fragment key={`${value}-${index}`}>
          {index > 0 && (
            <CountdownColon
              style={resolvedColonStyle}
              delay={(index - 1) * 0.3}
            />
          )}
          <div className="flex min-w-0 flex-col items-center gap-1">
            <span className="tabular-nums whitespace-nowrap" style={valueStyle}>
              <EditableText elementKey={valueElementKey}>{value}</EditableText>
            </span>
            <span className="whitespace-nowrap" style={labelStyle}>
              <EditableText elementKey={labelElementKey}>
                {labels[index]}
              </EditableText>
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
