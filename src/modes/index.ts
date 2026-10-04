import type { ModeDef, ModeId } from '../engine/types'
import { generateArithmetic, OPS } from './arithmetic/generator'
import { AUDIT_LEVELS } from './audit/engine'
import { CLOCK_LEVELS, generateClock, SHOW_CLOCK } from './clock/generator'
import { generatePercent } from './percent/generator'

/** Every game mode in the app. Adding a mode = adding an entry here plus its generator. */
export const MODES: ModeDef[] = [
  {
    id: 'arithmetic',
    name: 'Blitz',
    status: 'ready',
    options: OPS.map(({ id, label, title, defaultOn }) => ({ id, label, title, defaultOn })),
    keypad: (difficulty) => ({ decimal: false, negative: difficulty === 'hard' }),
    generate: generateArithmetic,
  },
  {
    id: 'percent',
    name: 'Delta',
    status: 'ready',
    // Answers are always whole numbers; only Hard's net % change can go negative.
    keypad: (difficulty) => ({ decimal: false, negative: difficulty === 'hard' }),
    generate: generatePercent,
  },
  {
    id: 'rush',
    name: 'Rush',
    status: 'ready',
    kind: 'rush',
    fixedDuration: 120,
  },
  {
    id: 'audit',
    name: 'Audit',
    status: 'ready',
    kind: 'audit',
    fixedDuration: 0,
    levels: AUDIT_LEVELS,
  },
  {
    id: 'clock',
    name: 'Tick Tock',
    status: 'ready',
    unit: '°',
    levels: CLOCK_LEVELS,
    switches: [
      { id: SHOW_CLOCK, label: 'Show clock', title: 'Show a clock face as well as the time', defaultOn: false },
    ],
    // Only Hard has answers ending in .5.
    keypad: (difficulty) => ({ decimal: difficulty === 'hard', negative: false }),
    generate: generateClock,
  },
]

export function getMode(id: ModeId): ModeDef {
  const mode = MODES.find((m) => m.id === id)
  if (!mode) throw new Error(`Unknown mode: ${id}`)
  return mode
}
