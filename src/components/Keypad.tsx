import type { Key } from '../engine/checkAnswer'
import { tap } from '../lib/haptics'

const ROWS: Key[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['-', '0', '.'],
]

const LABELS: Partial<Record<Key, string>> = { '-': '±', '.': '.' }

/**
 * On-screen number pad. Used instead of the phone keyboard because iPhone's number keyboard has
 * no minus or decimal key, and the system keyboard covers the screen and shifts the layout.
 * Drawn as a calculator grid: keys separated by 1px lines rather than floating buttons.
 */
export function Keypad({
  onKey,
  decimal,
  negative,
}: {
  onKey: (key: Key) => void
  decimal: boolean
  negative: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-px border border-border bg-border" role="group" aria-label="Number pad">
      {ROWS.flat().map((key) => {
        const disabled = (key === '.' && !decimal) || (key === '-' && !negative)
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            aria-label={key === '-' ? 'Toggle negative' : key === '.' ? 'Decimal point' : key}
            onPointerDown={(e) => {
              // Respond on finger-down rather than release: it feels noticeably faster.
              e.preventDefault()
              if (disabled) return
              tap()
              onKey(key)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!disabled) onKey(key)
              }
            }}
            className="h-14 bg-bg text-2xl text-fg transition-colors duration-75 active:bg-surface-2 disabled:text-transparent sm:h-16"
          >
            {LABELS[key] ?? key}
          </button>
        )
      })}
    </div>
  )
}
