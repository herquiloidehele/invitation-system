"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Description text that clamps to 3 lines and reveals a "show more"/"show less"
 * toggle — but only when the text actually overflows those 3 lines.
 *
 * Designed to live inside a clickable card (an <a>/preview trigger), so the
 * toggle stops click/keyboard propagation to avoid navigating or opening the
 * card's modal. It renders a fragment (<p> + toggle) so it slots straight into
 * the card's existing flex/block layout without an extra wrapper.
 */
export function ExpandableDescription({
  text,
  className,
  toggleClassName,
  moreLabel,
  lessLabel,
}: {
  text: string;
  className?: string;
  toggleClassName?: string;
  moreLabel: string;
  lessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // Overflow can only be measured while clamped; once expanded we keep the last
  // result so the "show less" toggle stays put.
  useEffect(() => {
    if (expanded) return;
    const el = ref.current;
    if (!el) return;
    const measure = () => setCanExpand(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  function toggle(event: React.SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
    setExpanded((value) => !value);
  }

  if (!text) return null;

  return (
    <>
      <p
        ref={ref}
        className={`${className ?? ""} ${expanded ? "" : "line-clamp-3"}`}
      >
        {text}
      </p>
      {canExpand ? (
        <span
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onClick={toggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") toggle(event);
          }}
          className={`mt-1.5 inline-flex w-fit cursor-pointer self-start rounded text-xs font-semibold underline underline-offset-2 transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${toggleClassName ?? ""}`}
        >
          {expanded ? lessLabel : moreLabel}
        </span>
      ) : null}
    </>
  );
}
