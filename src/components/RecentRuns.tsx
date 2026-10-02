import { useState } from 'react'
import type { SavedRound } from '../storage/stats'

const SLOTS = 10
const CHART_HEIGHT = 96

function timeAgo(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

/**
 * Bar chart of the last 10 runs at the current settings, oldest on the left.
 * Tap or hover a bar for details. `highlightLatest` marks the round just played.
 */
export function RecentRuns({
  runs,
  highlightLatest = false,
}: {
  /** Newest first, as stored. */
  runs: SavedRound[]
  highlightLatest?: boolean
}) {
  const [active, setActive] = useState<number | null>(null)
  const ordered = [...runs].reverse()
  const max = Math.max(1, ...ordered.map((r) => r.score))
  const best = Math.max(0, ...ordered.map((r) => r.score))
  const avg = ordered.length ? ordered.reduce((s, r) => s + r.score, 0) / ordered.length : 0
  const latestIndex = ordered.length - 1
  const empty = SLOTS - ordered.length

  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between text-sm text-muted">
        <h2>Last {SLOTS} runs</h2>
        {ordered.length > 0 && (
          <p className="flex gap-4">
            <span>
              Best <span className="text-fg">{best}</span>
            </span>
            <span>
              Avg <span className="text-fg">{avg.toFixed(1)}</span>
            </span>
          </p>
        )}
      </div>

      {ordered.length === 0 ? (
        <p className="flex items-center justify-center text-sm text-muted" style={{ height: CHART_HEIGHT + 20 }}>
          No runs yet
        </p>
      ) : (
        <div className="relative" onPointerLeave={() => setActive(null)}>
          {/* Baseline */}
          <div className="absolute inset-x-0 border-b border-border" style={{ top: CHART_HEIGHT + 20 }} />
          <ol className="grid grid-cols-10 gap-[2px]" style={{ height: CHART_HEIGHT + 20 }} aria-hidden>
            {ordered.map((run, i) => {
              const height = Math.max(4, (run.score / max) * CHART_HEIGHT)
              const isLatest = highlightLatest && i === latestIndex
              const isBest = run.score === best
              const dim = active !== null && active !== i
              // Accent marks the one bar that matters: this run on Results, the best run on Setup.
              const emphasized = highlightLatest ? isLatest : isBest
              const showLabel = active === i || isLatest || (isBest && active === null)
              return (
                <li
                  key={run.finishedAt}
                  className="relative flex flex-col items-center justify-end"
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                >
                  <span
                    className={`mb-1 text-[11px] leading-none text-muted transition-opacity ${showLabel ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {run.score}
                  </span>
                  <span
                    className={`block w-full max-w-7 transition-[opacity,height] duration-300 ${
                      emphasized ? 'bg-accent' : 'bg-bar'
                    } ${dim ? 'opacity-40' : ''}`}
                    style={{ height }}
                  />
                </li>
              )
            })}
            {Array.from({ length: empty }, (_, i) => (
              <li key={`empty-${i}`} className="flex flex-col items-center justify-end">
                <span className="block h-px w-full max-w-7 bg-border" />
              </li>
            ))}
          </ol>
          <p className="mt-2 h-4 text-center text-xs text-muted" aria-live="polite">
            {active !== null
              ? `${ordered[active].score} correct, ${timeAgo(ordered[active].finishedAt)}`
              : highlightLatest
                ? 'This run is highlighted'
                : 'Tap a bar for details'}
          </p>
        </div>
      )}

      {/* Same data as a table for screen readers. */}
      <table className="sr-only">
        <caption>Last {SLOTS} runs, newest first</caption>
        <thead>
          <tr>
            <th>Score</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.finishedAt}>
              <td>{r.score}</td>
              <td>{timeAgo(r.finishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
