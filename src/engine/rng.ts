import type { Rng } from './types'

/** Seeded random generator (mulberry32). Used by tests so random runs are reproducible. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random integer between min and max, inclusive. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

/** Pick from items using relative weights. */
export function pickWeighted<T>(rng: Rng, items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let r = rng() * total
  for (const item of items) {
    r -= item.weight
    if (r < 0) return item.value
  }
  return items[items.length - 1].value
}
