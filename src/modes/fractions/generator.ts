import { pick, randInt } from '../../engine/rng'
import type { Difficulty, GeneratorContext, Question, Rng } from '../../engine/types'

/*
 * Slice: fraction → percentage.
 * "Clean" denominators (whose percentages end quickly, like 3/8 = 37.5) are typed in.
 * "Tricky" ones (repeating decimals like 2/7 = 28.57…) are multiple choice instead.
 */

const TYPED: Record<Difficulty, number[]> = {
  easy: [2, 4, 5, 10],
  medium: [4, 5, 8, 20, 25],
  hard: [8, 20, 25, 40],
}

const CHOICE: Record<Difficulty, number[]> = {
  easy: [3],
  medium: [3, 6, 9, 12],
  hard: [6, 7, 9, 11, 12, 16],
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/**
 * The percentage shown for n/d: exact when it has at most two decimals (3/16 = 18.75),
 * otherwise rounded to one decimal (1/3 → 33.3).
 */
export function fractionPercent(n: number, d: number): number {
  if ((n * 10000) % d === 0) return (n * 10000) / d / 100
  return Math.round((n * 1000) / d) / 10
}

/** Numerator in lowest terms; improper (bigger than 1) only when `improper` is set. */
function numerator(rng: Rng, d: number, improper: boolean): number {
  for (;;) {
    const n = improper ? randInt(rng, d + 1, 2 * d - 1) : randInt(rng, 1, d - 1)
    if (gcd(n, d) === 1) return n
  }
}

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Believable wrong answers: neighbouring fractions, which are what people actually confuse. */
function distractors(rng: Rng, n: number, d: number, answer: number): number[] {
  const candidates = [
    [n + 1, d],
    [n - 1, d],
    [n, d + 1],
    [n, d - 1],
    [n + 1, d + 1],
    [n - 1, d - 1],
    [n, d + 2],
    [n, d - 2],
  ]
    .filter(([a, b]) => a > 0 && b > 1)
    .map(([a, b]) => fractionPercent(a, b))

  const picked: number[] = []
  // Closest first, so the options are genuinely tempting, but never closer than 1.5 points.
  for (const v of shuffle(rng, candidates).sort((x, y) => Math.abs(x - answer) - Math.abs(y - answer))) {
    if (picked.length === 3) break
    if (Math.abs(v - answer) >= 1.5 && picked.every((p) => Math.abs(p - v) >= 1)) picked.push(v)
  }
  // Fallback for tiny fractions with few neighbours: evenly spaced offsets.
  for (let k = 2; picked.length < 3; k += 2) {
    for (const v of [answer + k * 1.5, answer - k * 1.5]) {
      if (picked.length < 3 && v > 0 && picked.every((p) => Math.abs(p - v) >= 1)) picked.push(Math.round(v * 10) / 10)
    }
  }
  return picked
}

export function generateFractions({ difficulty, rng, previous }: GeneratorContext): Question {
  for (let attempt = 0; attempt < 20; attempt++) {
    const choice = rng() < 0.5
    const d = pick(rng, choice ? CHOICE[difficulty] : TYPED[difficulty])
    // On hard, some typed questions are bigger than 1 (e.g. 9/8 = 112.5%).
    const improper = !choice && difficulty === 'hard' && rng() < 0.3
    const n = numerator(rng, d, improper)
    const prompt = `${n}/${d}`
    if (prompt === previous?.prompt) continue

    const answer = fractionPercent(n, d)
    if (!choice) return { prompt, answer, input: 'type', tag: `d${d}` }
    return {
      prompt,
      answer,
      input: 'choice',
      choices: shuffle(rng, [answer, ...distractors(rng, n, d, answer)]),
      tag: `d${d}`,
    }
  }
  return { prompt: '1/2', answer: 50, input: 'type', tag: 'd2' }
}
