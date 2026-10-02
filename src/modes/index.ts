import type { ModeDef, ModeId } from '../engine/types'
import { generateArithmetic, OPS } from './arithmetic/generator'
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
    id: 'clock',
    name: 'Clock',
    status: 'soon',
    unit: '°',
  },
]

export function getMode(id: ModeId): ModeDef {
  const mode = MODES.find((m) => m.id === id)
  if (!mode) throw new Error(`Unknown mode: ${id}`)
  return mode
}
