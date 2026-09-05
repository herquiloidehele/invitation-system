/** Next volume in a linear fade-in, clamped to `target`. Pure. */
export function nextFadeVolume(
  current: number,
  step: number,
  target: number,
): number {
  return Math.min(Math.max(current, 0) + step, target);
}
