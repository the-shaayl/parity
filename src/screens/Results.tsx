import { useState } from 'react'
import { RecentRuns } from '../components/RecentRuns'
import { Button, TextButton } from '../components/ui'
import { summarize } from '../engine/sprint'
import type { RoundResult } from '../engine/types'
import { formatSeconds } from '../lib/format'
import { getMode } from '../modes'
import { getRecentRounds } from '../storage/stats'

export interface SaveInfo {
  isNewBest: boolean
  previousBest: number | null
}

export function Results({
  result,
  saveInfo,
  onPlayAgain,
  onSettings,
  onHome,
}: {
  result: RoundResult
  saveInfo: SaveInfo
  onPlayAgain: () => void
  onSettings: () => void
  onHome: () => void
}) {
  const { config, records } = result
  const mode = getMode(config.modeId)
  const summary = summarize(records)
  const [recent] = useState(() => getRecentRounds(config))

  return (
    <div className="mx-auto flex w-full max-w-md flex-col pb-4">
      <div className="flex items-baseline justify-between text-sm text-muted">
        <span className="flex gap-4">
          <span>{mode.name}</span>
          <span>{config.difficulty[0].toUpperCase() + config.difficulty.slice(1)}</span>
          <span>{config.duration}s</span>
        </span>
        <TextButton onClick={onHome}>All modes</TextButton>
      </div>

      <div className="pb-8 pt-12">
        <p className="text-sm text-muted">{mode.kind === 'rush' ? 'Points' : 'Score'}</p>
        <p className="text-8xl font-bold leading-none tracking-tighter text-accent">{summary.score}</p>
        <p className="mt-4 h-5 text-sm">
          {saveInfo.isNewBest ? (
            <span className="text-accent">
              New personal best{saveInfo.previousBest !== null && ` (was ${saveInfo.previousBest})`}
            </span>
          ) : (
            saveInfo.previousBest !== null && (
              <span className="text-muted">
                Personal best <span className="text-fg">{saveInfo.previousBest}</span>
              </span>
            )
          )}
        </p>
      </div>

      {mode.kind === 'rush' ? (
        // Rush: points come from exact hits (3) and near misses (1–2), so show that split.
        <dl className="grid grid-cols-3 gap-4">
          <Stat label="Exact" value={String(records.filter((r) => r.correct).length)} />
          <Stat label="Near misses" value={String(records.filter((r) => !r.correct && (r.points ?? 0) > 0).length)} />
          <Stat
            label="Fastest solve"
            value={
              records.some((r) => r.correct)
                ? formatSeconds(Math.min(...records.filter((r) => r.correct).map((r) => r.ms)))
                : '—'
            }
          />
        </dl>
      ) : (
        <dl className="grid grid-cols-3 gap-4">
          <Stat label="Accuracy" value={summary.attempted ? `${Math.round(summary.accuracy * 100)}%` : '—'} />
          <Stat
            label="Avg per answer"
            value={summary.avgCorrectMs !== null ? formatSeconds(summary.avgCorrectMs) : '—'}
          />
          <Stat label="Attempted" value={String(summary.attempted)} />
        </dl>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onSettings}>
          Settings
        </Button>
        <Button onClick={onPlayAgain} autoFocus>
          Play again
        </Button>
      </div>

      <div className="mt-12">
        <RecentRuns runs={recent} highlightLatest />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  )
}
