import { describe, expect, it } from 'vitest'
import { seededRng } from '../../engine/rng'
import { generateAudit, stage, windowMs, type AuditQuestion } from './engine'

/** Independently works out the real answer from the left-hand side the player sees. */
function solve(q: AuditQuestion): number {
  const m = q.left.replaceAll(',', '').match(/^(\d+) ([+−×÷]) (\d+)$/)
  if (!m) throw new Error(`Unrecognised: ${q.left}`)
  const [a, b] = [Number(m[1]), Number(m[3])]
  return { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[m[2]]!
}

describe('Audit generator', () => {
  for (const difficulty of ['easy', 'hard'] as const) {
    it(`labels every equation correctly as true or false on ${difficulty}`, () => {
      const rng = seededRng(17)
      let trues = 0
      for (let i = 0; i < 6000; i++) {
        const score = i % 60
        const q = generateAudit(difficulty, score, rng)
        const real = solve(q)
        expect(Number.isInteger(real), q.left).toBe(true)
        expect(real, q.left).toBe(q.truth)
        expect(real >= 0, q.left).toBe(true)
        expect(q.shown >= 0, `${q.left} = ${q.shown}`).toBe(true)
        // The key property: "true" means the equation really is right, and vice versa.
        expect(q.shown === real, `${q.left} = ${q.shown}`).toBe(q.isTrue)
        if (q.isTrue) trues++
      }
      // Roughly half true, half false.
      expect(trues / 6000).toBeGreaterThan(0.45)
      expect(trues / 6000).toBeLessThan(0.55)
    })
  }

  it('Easy only uses + and −; Hard uses all four', () => {
    const rng = seededRng(3)
    const easy = new Set<string>()
    const hard = new Set<string>()
    for (let i = 0; i < 2000; i++) {
      easy.add(generateAudit('easy', i % 50, rng).op)
      hard.add(generateAudit('hard', i % 50, rng).op)
    }
    expect([...easy].sort()).toEqual(['+', '−'])
    expect([...hard].sort()).toEqual(['+', '×', '÷', '−'].sort())
  })

  it('wrong answers get closer as the score climbs', () => {
    const rng = seededRng(8)
    const avgMiss = (score: number) => {
      let total = 0
      let n = 0
      for (let i = 0; i < 3000; i++) {
        const q = generateAudit('easy', score, rng)
        if (q.isTrue) continue
        total += Math.abs(q.shown - q.truth) / Math.max(1, q.truth)
        n++
      }
      return total / n
    }
    // Relative error shrinks from stage to stage.
    expect(avgMiss(0)).toBeGreaterThan(avgMiss(20))
    expect(avgMiss(20)).toBeGreaterThan(avgMiss(40))
    // By the last stage, + and − mistakes are only ever off by 1 or 2.
    for (let i = 0; i < 2000; i++) {
      const q = generateAudit('easy', 40, rng)
      if (!q.isTrue) expect(Math.abs(q.shown - q.truth), `${q.left} = ${q.shown}`).toBeLessThanOrEqual(2)
    }
  })

  it('stages and time limits', () => {
    expect([0, 4, 5, 14, 15, 29, 30, 100].map(stage)).toEqual([0, 0, 1, 1, 2, 2, 3, 3])
    expect(windowMs('easy', 0)).toBe(3000)
    expect(windowMs('hard', 0)).toBe(2700)
    expect(windowMs('easy', 40)).toBe(1500)
    expect(windowMs('easy', 200)).toBe(1500)
    expect(windowMs('easy', 20)).toBeLessThan(windowMs('easy', 10))
  })
})
