import type { CSSProperties } from "react";
import type { MediaProps } from "./ai-primitive-types";

interface ResolvedImageProps {
  src: string;
  alt: string;
  fill?: true;
  width?: number;
  height?: number;
  className?: string;
  style: CSSProperties;
}

/**
 * Resolve `<Media>`'s public props into the shape `next/image` needs. Pure so
 * the fill-vs-explicit branch and style defaults are unit-tested independently
 * of `next/image` (which can't run in the node test env).
 */
export function mediaImageProps(props: MediaProps): ResolvedImageProps {
  const objectFit = props.objectFit ?? "cover";
  const borderRadius =
    props.rounded === true
      ? 9999
      : typeof props.rounded === "number"
        ? props.rounded
        : undefined;

  const style: CSSProperties = {
    objectFit,
    ...(borderRadius !== undefined ? { borderRadius } : {}),
    ...props.style,
  };

  const base = {
    src: props.src,
    alt: props.alt ?? "",
    className: props.className,
    style,
  };

  if (props.fill) {
    return { ...base, fill: true };
  }
  return { ...base, width: props.width, height: props.height };
}
