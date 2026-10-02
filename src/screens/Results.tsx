import { Icons } from '../components/icons'
import { Button, Card } from '../components/ui'
import { summarize } from '../engine/sprint'
import type { RoundResult } from '../engine/types'
import { formatNumber, formatSeconds } from '../lib/format'
import { getMode } from '../modes'

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
  const missed = records.filter((r) => !r.correct)
  const unit = mode.unit ?? ''
  const durationLabel = config.duration < 60 ? `${config.duration}s` : `${config.duration / 60} min`

  return (
    <div className="anim-pop mx-auto flex w-full max-w-md flex-col">
      <p className="text-center text-sm text-muted">
        {mode.name} · <span className="capitalize">{config.difficulty}</span> · {durationLabel}
      </p>

      <div className="mt-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted">Score</p>
        <p className="text-8xl font-bold tracking-tight">{summary.score}</p>
        <div className="mt-3 flex h-8 items-center justify-center">
          {saveInfo.isNewBest ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
              <Icons.trophy /> New personal best
              {saveInfo.previousBest !== null && ` (was ${saveInfo.previousBest})`}
            </span>
          ) : (
            saveInfo.previousBest !== null && (
              <span className="text-sm text-muted">Personal best: {saveInfo.previousBest}</span>
            )
          )}
        </div>
      </div>

      <Card className="mt-8 grid grid-cols-3 divide-x divide-border py-4 text-center">
        <Stat label="Accuracy" value={summary.attempted ? `${Math.round(summary.accuracy * 100)}%` : '—'} />
        <Stat label="Avg / correct" value={summary.avgCorrectMs !== null ? formatSeconds(summary.avgCorrectMs) : '—'} />
        <Stat label="Attempted" value={String(summary.attempted)} />
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onSettings}>
          Settings
        </Button>
        <Button onClick={onPlayAgain} autoFocus>
          Play again
        </Button>
      </div>

      {missed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-semibold">Review ({missed.length})</h2>
          <ul className="flex flex-col gap-2">
            {missed.map((r, i) => (
              <li key={i}>
                <Card className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">{r.question.prompt}</span>
                    <span className="shrink-0 font-semibold text-success">
                      {formatNumber(r.question.answer)}
                      {unit}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {r.skipped ? 'Skipped' : `You chose ${formatNumber(r.given ?? 0)}${unit}`}
                    {r.question.explanation && ` · ${r.question.explanation}`}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button variant="ghost" className="mt-8 self-center" onClick={onHome}>
        All modes
      </Button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  )
}
