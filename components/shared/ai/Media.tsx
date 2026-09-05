"use client";

import Image from "next/image";
import type { ReactElement } from "react";

import { mediaImageProps } from "@/lib/ai-media";
import type { MediaProps } from "@/lib/ai-primitive-types";

/**
 * Image primitive over `next/image` — S3-hosted URLs, object-fit, optional
 * rounding. Two modes: explicit `width`+`height`, or `fill` (the agent sizes a
 * positioned parent). The host owns the optimization/domain plumbing; the
 * generated bundle just places `<Media>`.
 *
 * Video support (poster, memory-bounded playback) arrives in Phase 2f.
 */
export default function Media(props: MediaProps): ReactElement {
  const resolved = mediaImageProps(props);
  if (resolved.fill) {
    return (
      <Image
        src={resolved.src}
        alt={resolved.alt}
        fill
        sizes="(max-width: 500px) 100vw, 500px"
        className={resolved.className}
        style={resolved.style}
      />
    );
  }
  return (
    <Image
      src={resolved.src}
      alt={resolved.alt}
      width={resolved.width ?? 500}
      height={resolved.height ?? 500}
      className={resolved.className}
      style={resolved.style}
    />
  );
}
