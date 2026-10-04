import type { Key } from '../engine/checkAnswer'
import { tap } from '../lib/haptics'
import { Icons } from './icons'

const DIGIT_ROWS: Key[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * On-screen number pad, laid out like a phone's: digits, then [spare, 0, delete] along the bottom.
 * The spare key is "." for modes with decimal answers, "±" for modes with negative answers, or
 * empty. (No mode needs both; if one ever does, "±" takes the spare key and "." is not offered.)
 * Used instead of the phone keyboard because iPhone's number keyboard has no minus or decimal key,
 * and the system keyboard covers the screen and shifts the layout.
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
  const spare: Key | null = negative ? '-' : decimal ? '.' : null
  const keys: (Key | null)[] = [...DIGIT_ROWS, spare, '0', 'back']

  return (
    <div className="grid grid-cols-3 gap-px border border-border bg-border" role="group" aria-label="Number pad">
      {keys.map((key, i) =>
        key === null ? (
          <div key={`blank-${i}`} className="h-14 bg-bg sm:h-16" aria-hidden />
        ) : (
          <button
            key={key}
            type="button"
            aria-label={LABELS[key]}
            onPointerDown={(e) => {
              // Respond on finger-down rather than release: it feels noticeably faster.
              e.preventDefault()
              tap()
              onKey(key)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onKey(key)
              }
            }}
            className="flex h-14 items-center justify-center bg-bg text-2xl text-fg transition-colors duration-75 active:bg-surface-2 sm:h-16"
          >
            {key === 'back' ? <Icons.backspace /> : key === '-' ? '±' : key}
          </button>
        ),
      )}
    </div>
  )
}

const LABELS: Partial<Record<Key, string>> = { '-': 'Toggle negative', '.': 'Decimal point', back: 'Delete' }
