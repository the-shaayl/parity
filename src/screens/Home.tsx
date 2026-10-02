import type { ModeId } from '../engine/types'
import { MODES } from '../modes'
import { getModeBest } from '../storage/stats'

export function Home({ onSelect }: { onSelect: (id: ModeId) => void }) {
  return (
    <div className="pb-6">
      <header className="pt-2 text-sm font-semibold text-muted">Parity</header>

      <h1 className="pb-10 pt-14 text-5xl font-bold tracking-tight sm:text-6xl">Level up.</h1>

      <ol>
        {MODES.map((mode) => {
          const ready = mode.status === 'ready'
          const best = ready ? getModeBest(mode.id) : null
          return (
            <li key={mode.id}>
              <button
                type="button"
                disabled={!ready}
                onClick={() => onSelect(mode.id)}
                className="group flex w-full items-baseline gap-4 py-5 text-left disabled:cursor-default"
              >
                <span
                  className={`flex-1 text-xl font-semibold transition-colors ${ready ? 'group-hover:text-accent' : 'text-muted'}`}
                >
                  {mode.name}
                </span>
                <span className="text-sm text-muted">
                  {!ready ? (
                    'Soon'
                  ) : best ? (
                    <>
                      Best <span className="text-fg">{best.score}</span>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
                <span
                  className={`w-4 text-right text-muted transition-colors ${ready ? 'group-hover:text-accent' : 'invisible'}`}
                  aria-hidden
                >
                  →
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
