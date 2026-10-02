import { Icons } from '../components/icons'
import type { ModeId } from '../engine/types'
import { MODES } from '../modes'

export function Home({ onSelect }: { onSelect: (id: ModeId) => void }) {
  return (
    <div className="anim-pop">
      <header className="mb-8 pt-4">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-8" />
          <h1 className="text-2xl font-bold tracking-tight">Parity</h1>
        </div>
        <p className="mt-2 text-muted">Mental math drills for case and finance interviews.</p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {MODES.map((mode) => {
          const ready = mode.status === 'ready'
          return (
            <li key={mode.id}>
              <button
                type="button"
                disabled={!ready}
                onClick={() => onSelect(mode.id)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-accent/50 active:scale-[0.99] disabled:opacity-55 disabled:hover:border-border disabled:active:scale-100"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{mode.name}</h2>
                    {!ready && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">{mode.tagline}</p>
                </div>
                {ready && (
                  <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent">
                    <Icons.chevron />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
