import { pick, pickWeighted, randInt } from '../../engine/rng'
import type { Difficulty, GeneratorContext, Question, Rng } from '../../engine/types'
import { formatNumber, superscript } from '../../lib/format'

export type Op = 'add' | 'sub' | 'mul' | 'div' | 'pow' | 'fact'

export const OPS: { id: Op; label: string; title: string; defaultOn: boolean; weight: number }[] = [
  { id: 'add', label: '+', title: 'Addition', defaultOn: true, weight: 1 },
  { id: 'sub', label: '−', title: 'Subtraction', defaultOn: true, weight: 1 },
  { id: 'mul', label: '×', title: 'Multiplication', defaultOn: true, weight: 1 },
  { id: 'div', label: '÷', title: 'Division', defaultOn: true, weight: 1 },
  // Fewer distinct questions exist for these, so they come up less often to avoid repetition.
  { id: 'pow', label: 'xⁿ', title: 'Exponents', defaultOn: false, weight: 0.6 },
  { id: 'fact', label: 'n!', title: 'Factorials', defaultOn: false, weight: 0.35 },
]

type Range = [number, number]

/** Operand ranges per difficulty. Division reuses these as [divisor, quotient]. */
const RANGES: Record<'add' | 'mul' | 'div', Record<Difficulty, [Range, Range]>> = {
  add: {
    easy: [
      [10, 99],
      [10, 99],
    ],
    medium: [
      [100, 999],
      [10, 99],
    ],
    hard: [
      [100, 999],
      [100, 999],
    ],
  },
  mul: {
    easy: [
      [2, 12],
      [2, 12],
    ],
    medium: [
      [11, 99],
      [2, 9],
    ],
    hard: [
      [11, 99],
      [11, 99],
    ],
  },
  div: {
    easy: [
      [2, 12],
      [2, 12],
    ],
    medium: [
      [2, 9],
      [11, 99],
    ],
    hard: [
      [11, 30],
      [11, 60],
    ],
  },
}

/** [base, exponent] pairs available at each difficulty. */
function powerPool(difficulty: Difficulty): [number, number][] {
  const pool: [number, number][] = []
  const add = (bases: Range, exp: number, skipTens = false) => {
    for (let b = bases[0]; b <= bases[1]; b++) if (!(skipTens && b % 10 === 0)) pool.push([b, exp])
  }
  if (difficulty === 'easy') {
    add([2, 15], 2, true)
  } else if (difficulty === 'medium') {
    add([11, 25], 2, true)
    add([2, 6], 3)
    for (let e = 5; e <= 10; e++) pool.push([2, e])
  } else {
    add([26, 60], 2, true)
    add([5, 12], 3)
    for (let e = 8; e <= 12; e++) pool.push([2, e])
    for (let e = 3; e <= 6; e++) pool.push([3, e])
    for (let e = 3; e <= 5; e++) pool.push([5, e])
  }
  return pool
}

const FACT_RANGE: Record<Difficulty, Range> = { easy: [3, 6], medium: [4, 8], hard: [6, 10] }

function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1)
}

const fmt = formatNumber
const between = (rng: Rng, [min, max]: Range) => randInt(rng, min, max)

function makeQuestion(op: Op, difficulty: Difficulty, rng: Rng): Question {
  switch (op) {
    case 'add': {
      const [ra, rb] = RANGES.add[difficulty]
      const a = between(rng, ra)
      const b = between(rng, rb)
      return { prompt: `${fmt(a)} + ${fmt(b)}`, answer: a + b, input: 'type', tag: 'add' }
    }
    case 'sub': {
      const [ra, rb] = RANGES.add[difficulty]
      let a = between(rng, ra)
      let b = between(rng, rb)
      // Negative answers only on hard; otherwise keep the larger number first.
      if (difficulty !== 'hard' && b > a) [a, b] = [b, a]
      if (a === b) a += 1
      return { prompt: `${fmt(a)} − ${fmt(b)}`, answer: a - b, input: 'type', tag: 'sub' }
    }
    case 'mul': {
      const [ra, rb] = RANGES.mul[difficulty]
      let a = between(rng, ra)
      let b = between(rng, rb)
      if (rng() < 0.5) [a, b] = [b, a]
      return { prompt: `${fmt(a)} × ${fmt(b)}`, answer: a * b, input: 'type', tag: 'mul' }
    }
    case 'div': {
      // Built backwards from a multiplication so the answer is always a whole number.
      const [rd, rq] = RANGES.div[difficulty]
      const divisor = between(rng, rd)
      const quotient = between(rng, rq)
      return { prompt: `${fmt(divisor * quotient)} ÷ ${fmt(divisor)}`, answer: quotient, input: 'type', tag: 'div' }
    }
    case 'pow': {
      const [base, exp] = pick(rng, powerPool(difficulty))
      return { prompt: `${base}${superscript(exp)}`, answer: base ** exp, input: 'type', tag: 'pow' }
    }
    case 'fact': {
      const n = between(rng, FACT_RANGE[difficulty])
      const expansion = Array.from({ length: n }, (_, i) => n - i).join(' × ')
      return {
        prompt: `${n}!`,
        answer: factorial(n),
        input: 'type',
        tag: 'fact',
        explanation: `${expansion} = ${fmt(factorial(n))}`,
      }
    }
  }
}

export function generateArithmetic({ difficulty, options, rng, previous }: GeneratorContext): Question {
  const enabled = OPS.filter((o) => options[o.id])
  const pool = (enabled.length ? enabled : OPS.filter((o) => o.defaultOn)).map((o) => ({
    value: o.id,
    weight: o.weight,
  }))
  // Re-roll a few times to avoid showing the exact same question twice in a row.
  for (let attempt = 0; attempt < 10; attempt++) {
    const q = makeQuestion(pickWeighted(rng, pool), difficulty, rng)
    if (q.prompt !== previous?.prompt) return q
  }
  return makeQuestion(pickWeighted(rng, pool), difficulty, rng)
}
