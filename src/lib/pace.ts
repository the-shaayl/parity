/*
 * "Beat your best, live": how the current round compares with the personal best at the same
 * settings. The best is assumed to have been scored at an even pace across the round.
 */

export interface PaceMessage {
  text: string
  /** 'ahead' is shown in the accent colour; the others stay muted. */
  tone: 'ahead' | 'level' | 'behind'
}

/** Seconds to wait before showing pace, so the first moments of a round aren't noisy. */
export const PACE_DELAY_S = 5

export function paceMessage(
  score: number,
  best: number | null,
  elapsedS: number,
  durationS: number,
): PaceMessage | null {
  if (best === null || best <= 0 || durationS <= 0 || elapsedS < PACE_DELAY_S) return null
  const expected = Math.round(best * Math.min(1, elapsedS / durationS))
  const diff = score - expected
  if (diff > 0) return { text: `${diff} ahead of best`, tone: 'ahead' }
  if (diff < 0) return { text: `${-diff} behind best`, tone: 'behind' }
  return { text: 'Level with best', tone: 'level' }
}

/** Audit has no clock, so it shows the best to chase, then "New best" once it's passed. */
export function chaseBestMessage(score: number, best: number | null): PaceMessage | null {
  if (best === null || best <= 0) return null
  return score > best ? { text: 'New best', tone: 'ahead' } : { text: `Best ${best}`, tone: 'level' }
}
