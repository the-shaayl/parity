import type { SprintConfig } from '../engine/types'

export const APP_URL = 'https://parity-opal.vercel.app'

const capitalise = (s: string) => s[0].toUpperCase() + s.slice(1)

/**
 * The line people share after a round, e.g.
 * "Pack it up, you just got Parity mogged. 34 on Blitz (Hard, 60s)."
 */
export function shareText(modeName: string, kind: string | undefined, config: SprintConfig, score: number): string {
  const level = capitalise(config.difficulty)
  const settings = config.duration > 0 ? `${level}, ${config.duration}s` : level
  const what =
    kind === 'audit'
      ? `${score} in a row on ${modeName} (${settings})`
      : kind === 'rush'
        ? `${score} ${score === 1 ? 'point' : 'points'} on ${modeName} (${settings})`
        : `${score} on ${modeName} (${settings})`
  return `Pack it up, you just got Parity mogged. ${what}.`
}

/**
 * Opens the phone's share sheet. Where there isn't one (most laptops), copies the text and link
 * instead. Returns what happened so the button can say so.
 */
export async function shareScore(text: string): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share({ text, url: APP_URL })
      return 'shared'
    } catch (e) {
      // Closing the share sheet throws an AbortError; that's not a failure.
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${APP_URL}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}
