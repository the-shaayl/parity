import type { ModeId } from '../engine/types'

/**
 * Modes where the player ticked "Do not show again" on How to play. Kept under its own key,
 * apart from the versioned stats data, so it can be added or cleared without a migration.
 */
const KEY = 'parity:howToPlayHidden'

function read(): ModeId[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function isHowToPlayHidden(modeId: ModeId): boolean {
  return read().includes(modeId)
}

export function setHowToPlayHidden(modeId: ModeId, hidden: boolean) {
  const others = read().filter((m) => m !== modeId)
  try {
    localStorage.setItem(KEY, JSON.stringify(hidden ? [...others, modeId] : others))
  } catch {
    // Storage unavailable; How to play just keeps showing as before.
  }
}
