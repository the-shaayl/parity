import { pick, randInt } from '../../engine/rng'
import type { Difficulty, Rng } from '../../engine/types'
import { formatNumber } from '../../lib/format'

/*
 * Audit: an equation appears, the player taps true or false. One wrong tap or a timeout
 * ends the run. The longer the run, the bigger the numbers, the closer the wrong answers
 * and the shorter the time to answer.
 */

export type AuditOp = '+' | '−' | '×' | '÷'

export interface AuditQuestion {
  /** The left-hand side as shown, e.g. "7 × 8". */
  left: string
  /** The number shown after the equals sign. */
  shown: number
  /** The real answer. */
  truth: number
  isTrue: boolean
  op: AuditOp
}

const OPS: Record<Exclude<Difficulty, 'medium'>, AuditOp[]> = {
  easy: ['+', '−'],
  hard: ['+', '−', '×', '÷'],
}

export const AUDIT_LEVELS: Difficulty[] = ['easy', 'hard']

/** 0–3: how far into the run the player is. Everything gets harder at each step. */
export function stage(score: number): 0 | 1 | 2 | 3 {
  if (score < 5) return 0
  if (score < 15) return 1
  if (score < 30) return 2
  return 3
}

/** Milliseconds to answer: starts at 3s (2.7s on Hard), shrinks to 1.5s by a score of 40. */
export function windowMs(difficulty: Difficulty, score: number): number {
  const start = difficulty === 'hard' ? 2700 : 3000
  const end = 1500
  const t = Math.min(score, 40) / 40
  return Math.round(start - (start - end) * t)
}

type Range = [number, number]
const ADD: Range[][] = [
  [
    [2, 20],
    [2, 20],
  ],
  [
    [10, 60],
    [10, 60],
  ],
  [
    [20, 99],
    [20, 99],
  ],
  [
    [50, 199],
    [10, 99],
  ],
]
const MUL: Range[][] = [
  [
    [2, 9],
    [2, 9],
  ],
  [
    [2, 12],
    [2, 12],
  ],
  [
    [11, 19],
    [2, 9],
  ],
  [
    [11, 25],
    [3, 12],
  ],
]

const between = (rng: Rng, [lo, hi]: Range) => randInt(rng, lo, hi)

/** Swap the last two digits (54 → 45), if that gives a different number. */
function swapDigits(n: number): number | null {
  if (n < 10) return null
  const s = String(n)
  const swapped = Number(s.slice(0, -2) + s.at(-1) + s.at(-2))
  return swapped !== n && String(swapped).length === s.length ? swapped : null
}

/**
 * A believable wrong answer, matched to the stage: obviously wrong early on,
 * near-misses (off by 1 or 2, or the "right last digit" trap) later.
 */
export function wrongAnswer(rng: Rng, truth: number, op: AuditOp, a: number, b: number, s: 0 | 1 | 2 | 3): number {
  const candidates: number[] = []
  if (s === 0) {
    const lo = Math.max(3, Math.ceil(truth * 0.2))
    const hi = Math.max(lo + 2, Math.ceil(truth * 0.5))
    const off = randInt(rng, lo, hi)
    candidates.push(truth + off, truth - off)
  } else if (s === 1) {
    candidates.push(truth + 10, truth - 10, truth + randInt(rng, 3, 9), truth - randInt(rng, 3, 9))
    const swapped = swapDigits(truth)
    if (swapped !== null) candidates.push(swapped, swapped)
  } else if (s === 2) {
    candidates.push(truth + 1, truth - 1, truth + 2, truth - 2, truth + 10, truth - 10)
  } else {
    candidates.push(truth + 1, truth - 1, truth + 2, truth - 2)
    // "One factor out": 7 × 8 = 48 looks right because 48 is 6 × 8.
    if (op === '×') candidates.push((a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1))
  }
  const valid = candidates.filter((v) => v >= 0 && v !== truth)
  return valid.length ? pick(rng, valid) : truth + 1
}

export function generateAudit(
  difficulty: Difficulty,
  score: number,
  rng: Rng,
  previous?: AuditQuestion,
): AuditQuestion {
  const s = stage(score)
  const ops = difficulty === 'hard' ? OPS.hard : OPS.easy
  for (let attempt = 0; attempt < 20; attempt++) {
    const op = pick(rng, ops)
    let a: number
    let b: number
    let truth: number
    let left: string
    if (op === '+' || op === '−') {
      const [ra, rb] = ADD[s]
      a = between(rng, ra)
      b = between(rng, rb)
      if (op === '−' && b > a) [a, b] = [b, a]
      truth = op === '+' ? a + b : a - b
      left = `${formatNumber(a)} ${op} ${formatNumber(b)}`
    } else {
      const [ra, rb] = MUL[s]
      a = between(rng, ra)
      b = between(rng, rb)
      if (op === '×') {
        truth = a * b
        left = `${a} × ${b}`
      } else {
        // Division is built backwards from a multiplication so it always comes out even.
        truth = b
        left = `${formatNumber(a * b)} ÷ ${a}`
      }
    }
    const isTrue = rng() < 0.5
    const shown = isTrue ? truth : wrongAnswer(rng, truth, op, a, b, s)
    const q = { left, shown, truth, isTrue, op }
    if (previous && previous.left === q.left) continue
    return q
  }
  return { left: '2 + 2', shown: 4, truth: 4, isTrue: true, op: '+' }
}
