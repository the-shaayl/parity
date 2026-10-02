import { pick, randInt } from '../../engine/rng'
import type { Difficulty, Rng } from '../../engine/types'

/*
 * Rush: combine four numbers two at a time with + − × ÷ to reach a target.
 * Rules (v1): results may not go negative, division must come out whole.
 */

export type Op = '+' | '-' | '×' | '÷'
export const OPS: Op[] = ['+', '-', '×', '÷']

/**
 * The single source of truth for what move is legal. Used by the puzzle generator (to prove
 * a puzzle is solvable) and by the game (to validate the player's moves), so the two can
 * never disagree. Returns the result, or null if the move isn't allowed.
 */
export function applyOperation(a: number, op: Op, b: number): number | null {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b >= 0 ? a - b : null
    case '×':
      return a * b
    case '÷':
      return b !== 0 && a % b === 0 ? a / b : null
  }
}

export interface RushPuzzle {
  numbers: number[]
  target: number
  /** Fewest combinations that reach the target exactly. */
  par: number
}

/**
 * Every value reachable by combining the numbers, with the fewest moves needed to make it.
 * Four numbers means at most three moves, so trying every combination is instant.
 */
export function reachable(numbers: number[]): Map<number, number> {
  const best = new Map<number, number>()
  const explore = (pool: number[], moves: number) => {
    for (let i = 0; i < pool.length; i++) {
      for (let j = 0; j < pool.length; j++) {
        if (i === j) continue
        for (const op of OPS) {
          // + and × give the same answer either way round; only try one order.
          if ((op === '+' || op === '×') && j < i) continue
          const result = applyOperation(pool[i], op, pool[j])
          if (result === null) continue
          const made = moves + 1
          if (!best.has(result) || best.get(result)! > made) best.set(result, made)
          const rest = pool.filter((_, k) => k !== i && k !== j)
          explore([...rest, result], made)
        }
      }
    }
  }
  explore(numbers, 0)
  return best
}

interface LevelRules {
  big: number[]
  bigCount: number
  targetRange: [number, number]
  /** Minimum moves needed, so puzzles are never a single obvious step. */
  minPar: number
}

const LEVELS: Record<Difficulty, LevelRules> = {
  easy: { big: [25, 50], bigCount: 1, targetRange: [20, 100], minPar: 2 },
  medium: { big: [25, 50, 75, 100], bigCount: 1, targetRange: [50, 250], minPar: 2 },
  hard: { big: [25, 50, 75, 100], bigCount: 2, targetRange: [100, 500], minPar: 3 },
}

/**
 * Builds a puzzle that is guaranteed solvable: it draws the numbers first, works out every
 * value they can actually make, and only then picks the target from among those values.
 */
export function generateRushPuzzle(difficulty: Difficulty, rng: Rng, previous?: RushPuzzle): RushPuzzle {
  const rules = LEVELS[difficulty]
  for (let attempt = 0; attempt < 500; attempt++) {
    const numbers = [
      ...Array.from({ length: rules.bigCount }, () => pick(rng, rules.big)),
      ...Array.from({ length: 4 - rules.bigCount }, () => randInt(rng, 1, 10)),
    ]
    // A pair of the same number is fine; three of a kind looks like a glitch.
    if (numbers.some((n) => numbers.filter((m) => m === n).length > 2)) continue
    const [lo, hi] = rules.targetRange
    const candidates = [...reachable(numbers)].filter(
      ([value, par]) => value >= lo && value <= hi && par >= rules.minPar && !numbers.includes(value),
    )
    if (candidates.length === 0) continue
    const [target, par] = pick(rng, candidates)
    if (previous && target === previous.target) continue
    return { numbers: shuffle(rng, numbers), target, par }
  }
  throw new Error('Could not generate a Rush puzzle')
}

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Points for a finished puzzle: 3 for exact, 2 for very close, 1 for close, 0 otherwise.
 * "Close" scales with the target, so it means the same effort at every level.
 */
export function pointsFor(final: number, target: number): number {
  const off = Math.abs(final - target)
  if (off === 0) return 3
  if (off <= Math.max(1, Math.round(target * 0.02))) return 2
  if (off <= Math.max(3, Math.round(target * 0.05))) return 1
  return 0
}
