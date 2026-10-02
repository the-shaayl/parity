/**
 * Turns what the player has typed into a number, or null if it isn't a complete number yet
 * (e.g. "", "-", "12.").
 */
export function parseTyped(input: string): number | null {
  if (!/^-?\d+(\.\d+)?$/.test(input)) return null
  return Number(input)
}

/** True when the typed text equals the answer. Tolerance absorbs floating-point noise only. */
export function isCorrectTyped(input: string, answer: number): boolean {
  const n = parseTyped(input)
  return n !== null && Math.abs(n - answer) < 1e-9
}

const MAX_LENGTH = 10

export type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '-' | 'back'

/** Applies one keypad press to the current input text. */
export function applyKey(input: string, key: Key): string {
  if (key === 'back') return input.slice(0, -1)
  if (key === '-') return input.startsWith('-') ? input.slice(1) : '-' + input
  if (input.replace('-', '').length >= MAX_LENGTH) return input
  if (key === '.') {
    if (input.includes('.')) return input
    return input === '' || input === '-' ? input + '0.' : input + '.'
  }
  // Replace a lone leading zero instead of producing "07".
  if (input === '0') return key
  if (input === '-0') return '-' + key
  return input + key
}
