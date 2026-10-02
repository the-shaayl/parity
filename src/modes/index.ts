import type { ModeDef, ModeId } from '../engine/types'
import { generateArithmetic, OPS } from './arithmetic/generator'

/** Every game mode in the app. Adding a mode = adding an entry here plus its generator. */
export const MODES: ModeDef[] = [
  {
    id: 'arithmetic',
    name: 'Speed Arithmetic',
    tagline: 'Raw calculation reflexes',
    description: 'Addition, subtraction, multiplication and division, plus optional exponents and factorials.',
    status: 'ready',
    options: OPS.map(({ id, label, title, defaultOn }) => ({ id, label, title, defaultOn })),
    keypad: (difficulty) => ({ decimal: false, negative: difficulty === 'hard' }),
    generate: generateArithmetic,
  },
  {
    id: 'percent',
    name: 'Percent Changes',
    tagline: 'Discounts, deltas, successive changes',
    description: 'Deal and retail math: discounts, percentage change and stacked increases.',
    status: 'soon',
    unit: '%',
  },
  {
    id: 'fractions',
    name: 'Fractions → %',
    tagline: 'Convert in a heartbeat',
    description: 'Turn fractions like 3/8 or 7/16 into percentages.',
    status: 'soon',
    unit: '%',
  },
  {
    id: 'rule72',
    name: 'Rule of 72',
    tagline: 'Compounding shortcuts',
    description: 'Estimate doubling times and growth rates under pressure.',
    status: 'soon',
  },
  {
    id: 'clock',
    name: 'Clock Angles',
    tagline: 'Spatial reasoning',
    description: 'Find the angle between the hands of an analog clock.',
    status: 'soon',
    unit: '°',
  },
  {
    id: 'poker',
    name: '4-2 Poker Odds',
    tagline: 'Count outs, estimate equity',
    description: 'Count your outs and apply the 4-2 rule to estimate your odds.',
    status: 'soon',
    unit: '%',
  },
]

export function getMode(id: ModeId): ModeDef {
  const mode = MODES.find((m) => m.id === id)
  if (!mode) throw new Error(`Unknown mode: ${id}`)
  return mode
}
