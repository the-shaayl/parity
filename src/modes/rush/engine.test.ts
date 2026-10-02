import { describe, expect, it } from 'vitest'
import { seededRng } from '../../engine/rng'
import { DIFFICULTIES } from '../../engine/types'
import { applyOperation, generateRushPuzzle, OPS, pointsFor, reachable, type Op } from './engine'

describe('applyOperation', () => {
  it('allows normal moves', () => {
    expect(applyOperation(75, '-', 25)).toBe(50)
    expect(applyOperation(50, '×', 4)).toBe(200)
    expect(applyOperation(12, '÷', 4)).toBe(3)
    expect(applyOperation(7, '+', 8)).toBe(15)
  })
  it('rejects negative results, uneven division and division by zero', () => {
    expect(applyOperation(3, '-', 10)).toBeNull()
    expect(applyOperation(12, '÷', 5)).toBeNull()
    expect(applyOperation(12, '÷', 0)).toBeNull()
  })
})

/** Independent brute-force check: can these numbers reach the target in at most `moves` steps? */
function solvable(pool: number[], target: number, moves: number): boolean {
  if (pool.includes(target)) return true
  if (moves === 0) return false
  for (let i = 0; i < pool.length; i++)
    for (let j = 0; j < pool.length; j++) {
      if (i === j) continue
      for (const op of OPS as Op[]) {
        const r = applyOperation(pool[i], op, pool[j])
        if (r === null) continue
        if (solvable([...pool.filter((_, k) => k !== i && k !== j), r], target, moves - 1)) return true
      }
    }
  return false
}

describe('Rush puzzle generator', () => {
  const ranges = { easy: [10, 50], medium: [20, 100], hard: [50, 250] } as const
  const minPar = { easy: 2, medium: 2, hard: 2 } as const

  for (const difficulty of DIFFICULTIES) {
    it(`only produces solvable puzzles with the right shape on ${difficulty}`, () => {
      const rng = seededRng(99)
      for (let i = 0; i < 300; i++) {
        const p = generateRushPuzzle(difficulty, rng)
        expect(p.numbers).toHaveLength(4)
        expect(p.target).toBeGreaterThanOrEqual(ranges[difficulty][0])
        expect(p.target).toBeLessThanOrEqual(ranges[difficulty][1])
        expect(p.numbers).not.toContain(p.target)
        for (const n of p.numbers) expect(p.numbers.filter((m) => m === n).length).toBeLessThanOrEqual(2)
        if (difficulty === 'easy') for (const n of p.numbers) expect(n).toBeLessThanOrEqual(10)
        // Solvable in exactly `par` moves, and not in fewer.
        expect(solvable(p.numbers, p.target, p.par), JSON.stringify(p)).toBe(true)
        expect(solvable(p.numbers, p.target, p.par - 1), JSON.stringify(p)).toBe(false)
        expect(p.par).toBeGreaterThanOrEqual(minPar[difficulty])
      }
    })
  }

  it('reachable() finds known solutions', () => {
    // 75 − 25 = 50, 50 × 4 = 200
    expect(reachable([75, 25, 4, 1]).get(200)).toBe(2)
  })
})

describe('pointsFor', () => {
  it('scores exact, very close, close and far', () => {
    expect(pointsFor(200, 200)).toBe(3)
    expect(pointsFor(204, 200)).toBe(2) // within 2%
    expect(pointsFor(190, 200)).toBe(1) // within 5%
    expect(pointsFor(150, 200)).toBe(0)
    // Small targets still allow a little slack.
    expect(pointsFor(49, 50)).toBe(2)
    expect(pointsFor(47, 50)).toBe(1)
  })
})
