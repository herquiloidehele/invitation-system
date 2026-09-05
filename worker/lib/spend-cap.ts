/** True when spend has reached the cap. A non-positive cap disables the check. */
export function spendCapExceeded(spentUsd: number, capUsd: number): boolean {
  if (!(capUsd > 0)) return false;
  return spentUsd >= capUsd;
}
