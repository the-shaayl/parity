import { pick, randInt } from '../../engine/rng'
import type { Difficulty, GeneratorContext, Question, Rng } from '../../engine/types'
import { formatNumber } from '../../lib/format'

/*
 * Delta: percentage questions of the kind that come up in case and deal math.
 * Every question is built so the answer is a whole number.
 */

export type DeltaKind = 'of' | 'sale' | 'successive'

const KINDS: Record<Difficulty, DeltaKind[]> = {
  easy: ['of', 'sale'],
  medium: ['of', 'sale'],
  hard: ['of', 'sale', 'successive'],
}

/** Percentages used for "X% of" and discounts. */
const PERCENTS: Record<Difficulty, number[]> = {
  easy: [5, 10, 20, 25, 50, 75],
  medium: [15, 30, 35, 40, 45, 60, 12.5],
  hard: [8, 12, 18, 35, 65, 2.5, 17.5, 22.5],
}

/** Easy discounts stay simple: multiples of 10. */
const EASY_DISCOUNTS = [10, 20, 30, 40, 50]

/** [step, min, max] for the number a percentage is taken of. */
type BaseRange = [number, number, number]
const BASES: Record<Difficulty, BaseRange> = {
  easy: [20, 40, 400],
  medium: [10, 50, 900],
  hard: [1, 20, 999],
}
/** Easy sale prices are multiples of $50. */
const EASY_PRICES: BaseRange = [50, 50, 500]

/** True when n is a whole number (ignoring floating-point noise). */
export function isWhole(n: number): boolean {
  return Math.abs(n - Math.round(n)) < 1e-9
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b

/** Smallest whole number b for which p% of b is whole. Works for percentages with one decimal place. */
function wholeStep(p: number): number {
  const tenths = Math.round(p * 10)
  return 1000 / gcd(tenths, 1000)
}

/** A number in the range that p% of (and 100 − p% of) comes out whole. */
function base(rng: Rng, [step, min, max]: BaseRange, p: number): number {
  const s = lcm(step, wholeStep(p))
  return randInt(rng, Math.ceil(min / s), Math.floor(max / s)) * s
}

const pct = (p: number) => `${formatNumber(p)}%`
const signed = (p: number) => `${p > 0 ? '+' : '−'}${formatNumber(Math.abs(p))}%`

/** Draws numbers until `build` produces a question with a whole-number answer. */
function retry(rng: Rng, build: (rng: Rng) => Question | null): Question {
  for (let i = 0; i < 200; i++) {
    const q = build(rng)
    if (q && Number.isFinite(q.answer) && isWhole(q.answer)) return { ...q, answer: Math.round(q.answer) }
  }
  throw new Error('Could not build a clean percentage question')
}

function makeQuestion(kind: DeltaKind, difficulty: Difficulty, rng: Rng): Question {
  switch (kind) {
    case 'of':
      return retry(rng, (r) => {
        const p = pick(r, PERCENTS[difficulty])
        const b = base(r, BASES[difficulty], p)
        return { prompt: `${pct(p)} of ${formatNumber(b)}`, answer: (b * p) / 100, input: 'type', tag: 'of' }
      })

    case 'sale':
      return retry(rng, (r) => {
        const easy = difficulty === 'easy'
        const p = pick(r, easy ? EASY_DISCOUNTS : PERCENTS[difficulty])
        const price = base(r, easy ? EASY_PRICES : BASES[difficulty], p)
        return {
          label: 'Sale price',
          prompt: `$${formatNumber(price)}, ${pct(p)} off`,
          answer: (price * (100 - p)) / 100,
          prefix: '$',
          input: 'type',
          tag: 'sale',
          explanation: `$${formatNumber(price)} × ${formatNumber(100 - p)}%`,
        }
      })

    case 'successive':
      return retry(rng, (r) => {
        const a = randInt(r, -10, 10) * 5
        const b = randInt(r, -10, 10) * 5
        if (a === 0 || b === 0) return null
        return {
          label: 'Net % change',
          prompt: `${signed(a)} then ${signed(b)}`,
          answer: a + b + (a * b) / 100,
          unit: '%',
          input: 'type',
          tag: 'successive',
          explanation: `${formatNumber(a)} + ${formatNumber(b)} + (${formatNumber(a)} × ${formatNumber(b)} ÷ 100)`,
        }
      })
  }
}

export function generatePercent({ difficulty, rng, previous }: GeneratorContext): Question {
  for (let attempt = 0; attempt < 10; attempt++) {
    const q = makeQuestion(pick(rng, KINDS[difficulty]), difficulty, rng)
    if (q.prompt !== previous?.prompt) return q
  }
  return makeQuestion(pick(rng, KINDS[difficulty]), difficulty, rng)
}
