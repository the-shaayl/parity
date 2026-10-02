import { describe, expect, it } from 'vitest'
import { seededRng } from '../../engine/rng'
import type { Question } from '../../engine/types'
import { CLOCK_LEVELS, clockAngle, clockTimes, generateClock } from './generator'

describe('clockAngle', () => {
  it.each([
    [3, 0, 90],
    [6, 0, 180],
    [7, 30, 45],
    [2, 15, 22.5],
    [9, 45, 22.5],
    [11, 30, 165],
    [1, 0, 30],
  ])('%i:%i is %d°', (hour, minute, expected) => {
    expect(clockAngle(hour, minute)).toBe(expected)
  })
})

/**
 * Independent check from the text the player sees: measure both hands in minute marks
 * around the dial (60 per turn), take the gap, and convert to degrees.
 */
function solveFromPrompt(prompt: string): number {
  const [, h, m] = prompt.match(/^(\d{1,2}):(\d\d)$/)!.map(Number)
  const hourMarks = (h % 12) * 5 + m / 12
  const gap = Math.abs(hourMarks - m) * 6
  return gap > 180 ? 360 - gap : gap
}

describe('Clock generator', () => {
  for (const difficulty of CLOCK_LEVELS) {
    it(`produces correct answers on ${difficulty}`, () => {
      const rng = seededRng(31)
      let previous: Question | undefined
      const seen = new Set<string>()
      for (let i = 0; i < 5000; i++) {
        const q = generateClock({ difficulty, options: {}, rng, previous })
        expect(q.answer, q.prompt).toBe(solveFromPrompt(q.prompt))
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThanOrEqual(180)
        expect(q.prompt).not.toBe('12:00')
        expect(q.prompt).not.toBe(previous?.prompt)
        expect(q.prompt, 'no leading zero').toMatch(/^[1-9]\d?:\d\d$/)
        expect(q.time, q.prompt).toBeDefined()
        expect(q.input).toBe('type')
        if (difficulty === 'easy') {
          expect(q.time!.minute % 30, q.prompt).toBe(0)
          expect(q.answer % 15, q.prompt).toBe(0)
        } else {
          expect(q.time!.minute % 15, q.prompt).toBe(0)
          expect((q.answer * 2) % 1, q.prompt).toBe(0)
        }
        seen.add(q.prompt)
        previous = q
      }
      // Every time on the level shows up.
      expect(seen.size).toBe(clockTimes(difficulty).length)
    })
  }

  it('offers 23 times on Easy and 47 on Hard', () => {
    expect(clockTimes('easy')).toHaveLength(23)
    expect(clockTimes('hard')).toHaveLength(47)
  })

  it('gives some x.5 answers on Hard', () => {
    expect(clockTimes('hard').some((t) => !Number.isInteger(clockAngle(t.hour, t.minute)))).toBe(true)
  })
})
