import type { ModeId } from '../engine/types'

/**
 * Modes whose How to play has already opened by itself once on this device. Kept under its own
 * key, apart from the versioned stats data, so no migration is needed.
 */
const KEY = 'parity:howToPlaySeen'

function read(): ModeId[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function hasSeenHowToPlay(modeId: ModeId): boolean {
  return read().includes(modeId)
}

export function markHowToPlaySeen(modeId: ModeId) {
  const list = read()
  if (list.includes(modeId)) return
  try {
    localStorage.setItem(KEY, JSON.stringify([...list, modeId]))
  } catch {
    // Storage unavailable; How to play may open again next visit, which is harmless.
  }
}
