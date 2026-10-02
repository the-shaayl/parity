const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}

/** 1656 -> "1,656"; 37.5 -> "37.5"; -4 -> "−4" (true minus sign). */
export function formatNumber(n: number): string {
  const s = n.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return s.replace('-', '−')
}

export function superscript(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUPERSCRIPT[d] ?? d)
    .join('')
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}
