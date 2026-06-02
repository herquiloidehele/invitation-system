"use client";

import {
  getPhoneFrameAnimation,
  type PhonePreviewAnimation,
} from "@/lib/landing-phone-animation";

export function PhoneIframePreview({
  title,
  src,
  showCaption = true,
  animation,
  reduceMotion,
  isMobile,
}: {
  title: string;
  src: string;
  showCaption?: boolean;
  animation?: PhonePreviewAnimation;
  reduceMotion?: boolean | null;
  isMobile?: boolean | null;
}) {
  const frame = getPhoneFrameAnimation(animation, reduceMotion, isMobile);
  const stageClassName = [
    "relative mx-auto w-full max-w-[20rem]",
    frame.stageClassName,
  ]
    .filter(Boolean)
    .join(" ");
  const phoneClassName = [
    "relative aspect-9/17 w-full rounded-[2rem] border-8 border-[#2D3A2D] bg-white shadow-[0_30px_80px_rgba(31,36,32,0.22),inset_0_0_0_1px_rgba(255,255,255,0.06)]",
    frame.phoneClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="text-center">
      <div className={stageClassName}>
        {frame.showStaticShadow ? (
          <span aria-hidden="true" className="hero-phone-static-shadow" />
        ) : null}
        {frame.showAnimatedGlow ? (
          <span aria-hidden="true" className="hero-phone-glow" />
        ) : null}
        <div className={phoneClassName}>
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-3 z-20 h-3.5 w-16 -translate-x-1/2 rounded-full bg-[#0D1510] shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
          />
          <div className="absolute inset-0 overflow-hidden rounded-[1.4rem]">
            <iframe
              title={`Pré-visualização do convite ${title}`}
              src={src}
              className="h-full w-full border-0 [scrollbar-width:none]"
              loading="lazy"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_24%)]"
            />
          </div>
        </div>
        {frame.showSparkles ? (
          <>
            <span aria-hidden="true" className="hero-phone-sparkle" />
            <span
              aria-hidden="true"
              className="hero-phone-sparkle hero-phone-sparkle--2"
            />
            <span
              aria-hidden="true"
              className="hero-phone-sparkle hero-phone-sparkle--3"
            />
          </>
        ) : null}
      </div>
      {showCaption ? (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="md:hidden mt-4 inline-flex rounded-full border border-[#E5E7E4] bg-white px-6 py-3 text-sm font-semibold text-[#1F2420] transition hover:border-[#3F4E3F] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
        >
          Abrir convite →
        </a>
      ) : null}
    </article>
  );
}
