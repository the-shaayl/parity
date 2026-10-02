import { describe, expect, it } from 'vitest'
import { seededRng } from '../../engine/rng'
import { DIFFICULTIES, type Question } from '../../engine/types'
import { generateArithmetic, OPS, RARE_OP_GAP_MS } from './generator'

const allOn = Object.fromEntries(OPS.map((o) => [o.id, true]))
const SUPER = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** Independently re-computes the answer from the text the player actually sees. */
function solveFromPrompt(prompt: string): number {
  const p = prompt.replaceAll(',', '')
  let m = p.match(/^(\d+) ([+−×÷]) (\d+)$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[3])]
    return { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[m[2]]!
  }
  m = p.match(/^(\d+)!$/)
  if (m) {
    let r = 1
    for (let i = 2; i <= Number(m[1]); i++) r *= i
    return r
  }
  m = p.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/)
  if (m) {
    const exp = Number([...m[2]].map((c) => SUPER.indexOf(c)).join(''))
    return Number(m[1]) ** exp
  }
  throw new Error(`Unrecognised prompt: ${prompt}`)
}

describe('arithmetic generator', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`produces correct, whole-number questions on ${difficulty}`, () => {
      const rng = seededRng(42)
      let previous: Question | undefined
      for (let i = 0; i < 5000; i++) {
        const q = generateArithmetic({ difficulty, options: allOn, rng, previous })
        expect(Number.isInteger(q.answer), q.prompt).toBe(true)
        expect(solveFromPrompt(q.prompt), q.prompt).toBe(q.answer)
        expect(q.input).toBe('type')
        if (difficulty !== 'hard') expect(q.answer, q.prompt).toBeGreaterThanOrEqual(0)
        expect(q.prompt).not.toBe(previous?.prompt)
        previous = q
      }
    })
  }

  it('only uses the operations that are switched on', () => {
    const rng = seededRng(7)
    for (let i = 0; i < 500; i++) {
      const q = generateArithmetic({ difficulty: 'medium', options: { mul: true }, rng })
      expect(q.tag).toBe('mul')
    }
  })

  it('falls back to the defaults if every operation is switched off', () => {
    const q = generateArithmetic({ difficulty: 'easy', options: {}, rng: seededRng(1) })
    expect(['add', 'sub', 'mul', 'div']).toContain(q.tag)
  })

  it('keeps powers and factorials within each level', () => {
    const limits = {
      easy: { squares: 10, cubes: 0, fact: 5 },
      medium: { squares: 25, cubes: 0, fact: 7 },
      hard: { squares: 30, cubes: 10, fact: 10 },
    }
    for (const difficulty of DIFFICULTIES) {
      const rng = seededRng(13)
      const limit = limits[difficulty]
      for (let i = 0; i < 3000; i++) {
        const q = generateArithmetic({ difficulty, options: { pow: true, fact: true }, rng })
        const fact = q.prompt.match(/^(\d+)!$/)
        if (fact) {
          expect(Number(fact[1]), q.prompt).toBeLessThanOrEqual(limit.fact)
          continue
        }
        const [, base, exp] = q.prompt.match(/^(\d+)([²³])$/)!
        expect(Number(base), q.prompt).toBeLessThanOrEqual(exp === '²' ? limit.squares : limit.cubes)
      }
    }
  })

  it('shows at most one exponent and one factorial every 30 seconds', () => {
    const rng = seededRng(17)
    const shownAt: Record<string, number> = {}
    // A fast player: a new question every 2 seconds for 10 minutes.
    for (let t = 0; t < 600_000; t += 2000) {
      const sinceShown = Object.fromEntries(Object.entries(shownAt).map(([tag, at]) => [tag, t - at]))
      const q = generateArithmetic({ difficulty: 'hard', options: allOn, rng, sinceShown })
      if (q.tag === 'pow' || q.tag === 'fact') {
        if (shownAt[q.tag] !== undefined) expect(t - shownAt[q.tag], q.tag).toBeGreaterThanOrEqual(RARE_OP_GAP_MS)
      }
      shownAt[q.tag] = t
    }
    expect(shownAt.pow).toBeDefined()
    expect(shownAt.fact).toBeDefined()
  })

  it('covers every operation', () => {
    const rng = seededRng(3)
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i++) seen.add(generateArithmetic({ difficulty: 'hard', options: allOn, rng }).tag)
    expect([...seen].sort()).toEqual(OPS.map((o) => o.id).sort())
  })
})
