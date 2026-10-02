import { describe, expect, it } from 'vitest'
import { seededRng } from '../../engine/rng'
import { DIFFICULTIES, type Question } from '../../engine/types'
import { fractionPercent, generateFractions } from './generator'

describe('fractionPercent', () => {
  it('is exact when the decimal ends within two places, otherwise rounds to one', () => {
    expect(fractionPercent(3, 8)).toBe(37.5)
    expect(fractionPercent(7, 16)).toBe(43.75)
    expect(fractionPercent(1, 3)).toBe(33.3)
    expect(fractionPercent(2, 3)).toBe(66.7)
    expect(fractionPercent(2, 7)).toBe(28.6)
    expect(fractionPercent(9, 8)).toBe(112.5)
  })
})

describe('Slice (fractions) generator', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`produces correct questions on ${difficulty}`, () => {
      const rng = seededRng(21)
      let previous: Question | undefined
      let typed = 0
      let choice = 0
      for (let i = 0; i < 5000; i++) {
        const q = generateFractions({ difficulty, options: {}, rng, previous })
        const [n, d] = q.prompt.split('/').map(Number)
        const exact = (n / d) * 100
        // Answer matches the fraction (exact for typed, within rounding for choices).
        expect(Math.abs(q.answer - exact), q.prompt).toBeLessThanOrEqual(q.input === 'type' ? 1e-9 : 0.05)
        expect(q.prompt).not.toBe(previous?.prompt)

        if (q.input === 'type') {
          typed++
          // Typed answers never need more than two decimal places.
          expect(Math.abs(q.answer * 100 - Math.round(q.answer * 100)), q.prompt).toBeLessThan(1e-9)
        } else {
          choice++
          const choices = q.choices!
          expect(choices).toHaveLength(4)
          expect(choices).toContain(q.answer)
          expect(new Set(choices).size).toBe(4)
          // Wrong options are clearly wrong, not rounding-error close.
          for (const c of choices)
            if (c !== q.answer) expect(Math.abs(c - q.answer), q.prompt).toBeGreaterThanOrEqual(1)
          for (const c of choices) expect(c).toBeGreaterThan(0)
        }
        previous = q
      }
      expect(typed).toBeGreaterThan(1000)
      expect(choice).toBeGreaterThan(1000)
    })
  }
})
