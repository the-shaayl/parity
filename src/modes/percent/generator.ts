import { pick, randInt } from '../../engine/rng'
import type { Difficulty, GeneratorContext, Question, Rng } from '../../engine/types'
import { formatNumber } from '../../lib/format'

/*
 * Delta: percentage questions of the kind that come up in case and deal math.
 * Every question is built so the answer is a whole number or has one decimal place.
 */

export type DeltaKind = 'of' | 'sale' | 'successive' | 'stacked' | 'reverse'

const KINDS: Record<Difficulty, DeltaKind[]> = {
  easy: ['of', 'sale'],
  medium: ['of', 'sale', 'successive'],
  hard: ['of', 'sale', 'successive', 'stacked', 'reverse'],
}

/** Percentages used for "X% of" and discounts. */
const PERCENTS: Record<Difficulty, number[]> = {
  easy: [5, 10, 20, 25, 50, 75],
  medium: [15, 30, 35, 40, 45, 60, 12.5],
  hard: [8, 12, 18, 35, 65, 2.5, 17.5, 22.5],
}

/** True when n has at most one decimal place (ignoring floating-point noise). */
export function atMostOneDecimal(n: number): boolean {
  return Math.abs(n * 10 - Math.round(n * 10)) < 1e-9
}

const round1 = (n: number) => Math.round(n * 10) / 10
const pct = (p: number) => `${formatNumber(p)}%`
const signed = (p: number) => `${p > 0 ? '+' : '−'}${formatNumber(Math.abs(p))}%`

/** Draws numbers until `build` produces a question with a clean answer. */
function retry(rng: Rng, build: (rng: Rng) => Question | null): Question {
  for (let i = 0; i < 200; i++) {
    const q = build(rng)
    if (q && Number.isFinite(q.answer) && atMostOneDecimal(q.answer)) return { ...q, answer: round1(q.answer) }
  }
  throw new Error('Could not build a clean percentage question')
}

function base(rng: Rng, difficulty: Difficulty): number {
  if (difficulty === 'easy') return randInt(rng, 2, 20) * 20
  if (difficulty === 'medium') return randInt(rng, 5, 90) * 10
  return randInt(rng, 20, 999)
}

function makeQuestion(kind: DeltaKind, difficulty: Difficulty, rng: Rng): Question {
  switch (kind) {
    case 'of':
      return retry(rng, (r) => {
        const p = pick(r, PERCENTS[difficulty])
        const b = base(r, difficulty)
        return { prompt: `${pct(p)} of ${formatNumber(b)}`, answer: (b * p) / 100, input: 'type', tag: 'of' }
      })

    case 'sale':
      return retry(rng, (r) => {
        const p = pick(r, PERCENTS[difficulty])
        const price = base(r, difficulty)
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
        const step = difficulty === 'hard' ? 5 : 10
        const a = randInt(r, -50 / step, 50 / step) * step
        const b = randInt(r, -50 / step, 50 / step) * step
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

    case 'stacked':
      return retry(rng, (r) => {
        const a = randInt(r, 1, 8) * 5
        const b = randInt(r, 1, 6) * 5
        return {
          label: 'Total discount',
          prompt: `${pct(a)} off, then ${pct(b)} off`,
          answer: a + b - (a * b) / 100,
          unit: '%',
          input: 'type',
          tag: 'stacked',
          explanation: `${a} + ${b} − (${a} × ${b} ÷ 100)`,
        }
      })

    case 'reverse':
      return retry(rng, (r) => {
        const p = pick(r, [10, 20, 25, 50, 60, 75, -10, -20, -25, -40, -50])
        const original = randInt(r, 4, 80) * 5
        const after = (original * (100 + p)) / 100
        if (!Number.isInteger(after)) return null
        return {
          label: 'Original price',
          prompt: `${signed(p)} → $${formatNumber(after)}`,
          answer: original,
          prefix: '$',
          input: 'type',
          tag: 'reverse',
          explanation: `$${formatNumber(after)} ÷ ${formatNumber((100 + p) / 100)}`,
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
