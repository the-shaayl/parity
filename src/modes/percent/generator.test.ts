import { describe, expect, it } from 'vitest'
import { seededRng } from '../../engine/rng'
import { DIFFICULTIES, type Question } from '../../engine/types'
import { atMostOneDecimal, generatePercent } from './generator'

const num = (s: string) => Number(s.replaceAll(',', '').replace('−', '-').replace('+', ''))

/** Independently re-computes the answer from the text the player actually sees. */
function solveFromPrompt(q: Question): number {
  const p = q.prompt
  let m: RegExpMatchArray | null
  if ((m = p.match(/^([\d.]+)% of ([\d,]+)$/))) return (num(m[1]) * num(m[2])) / 100
  if ((m = p.match(/^\$([\d,]+), ([\d.]+)% off$/))) return num(m[1]) * (1 - num(m[2]) / 100)
  if ((m = p.match(/^([+−][\d.]+)% then ([+−][\d.]+)%$/)))
    return ((1 + num(m[1]) / 100) * (1 + num(m[2]) / 100) - 1) * 100
  if ((m = p.match(/^([\d.]+)% off, then ([\d.]+)% off$/)))
    return (1 - (1 - num(m[1]) / 100) * (1 - num(m[2]) / 100)) * 100
  if ((m = p.match(/^([+−][\d.]+)% → \$([\d,]+)$/))) return num(m[2]) / (1 + num(m[1]) / 100)
  throw new Error(`Unrecognised prompt: ${p}`)
}

describe('Delta (percent) generator', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`produces correct, clean answers on ${difficulty}`, () => {
      const rng = seededRng(11)
      let previous: Question | undefined
      const kinds = new Set<string>()
      for (let i = 0; i < 5000; i++) {
        const q = generatePercent({ difficulty, options: {}, rng, previous })
        expect(solveFromPrompt(q), q.prompt).toBeCloseTo(q.answer, 9)
        expect(atMostOneDecimal(q.answer), q.prompt).toBe(true)
        expect(q.input).toBe('type')
        if (difficulty === 'easy') expect(q.answer, q.prompt).toBeGreaterThanOrEqual(0)
        expect(q.prompt, 'no "a → b" percent-change questions').not.toMatch(/^[\d,]+ → [\d,]+$/)
        expect(q.prompt).not.toBe(previous?.prompt)
        kinds.add(q.tag)
        previous = q
      }
      expect(kinds.size).toBe({ easy: 2, medium: 3, hard: 5 }[difficulty])
    })
  }

  it('labels every question that needs one', () => {
    const rng = seededRng(5)
    for (let i = 0; i < 500; i++) {
      const q = generatePercent({ difficulty: 'hard', options: {}, rng })
      if (q.tag !== 'of') expect(q.label, q.prompt).toBeTruthy()
    }
  })
})
