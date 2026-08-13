export type CarouselIndicatorMode = "none" | "dots" | "bar";

/** Above this many slides, dots stop being readable or reliably tappable. */
const MAX_DOTS = 8;

/** Keep the scrollbar thumb visible no matter how long the list gets. */
const MIN_THUMB_WIDTH_PERCENT = 12;

export function getCarouselIndicatorMode(
  slideCount: number,
): CarouselIndicatorMode {
  if (!Number.isFinite(slideCount) || slideCount <= 1) return "none";
  if (slideCount <= MAX_DOTS) return "dots";
  return "bar";
}

export type CarouselThumbMetrics = {
  widthPercent: number;
  leftPercent: number;
};

export function getCarouselThumbMetrics(
  slideCount: number,
  progress: number,
): CarouselThumbMetrics {
  const safeCount =
    Number.isFinite(slideCount) && slideCount > 0 ? slideCount : 1;
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const clampedProgress = Math.min(1, Math.max(0, safeProgress));
  const widthPercent = Math.max(MIN_THUMB_WIDTH_PERCENT, 100 / safeCount);

  return {
    widthPercent,
    leftPercent: clampedProgress * (100 - widthPercent),
  };
}
