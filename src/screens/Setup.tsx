import { useState } from 'react'
import { HowToPlay } from '../components/HowToPlay'
import { RecentRuns } from '../components/RecentRuns'
import { Button, OptionRow, TextButton } from '../components/ui'
import { DIFFICULTIES, DURATIONS, type ModeId, type SprintConfig } from '../engine/types'
import { getMode } from '../modes'
import { INSTRUCTIONS } from '../modes/instructions'
import { isHowToPlayHidden } from '../storage/howToPlay'
import { getBest, getLastConfig, getRecentRounds, hasPlayed } from '../storage/stats'

function defaultConfig(modeId: ModeId): SprintConfig {
  const mode = getMode(modeId)
  return {
    modeId,
    difficulty: mode.levels?.includes('medium') === false ? mode.levels[0] : 'medium',
    duration: 60,
    options: Object.fromEntries((mode.options ?? []).map((o) => [o.id, o.defaultOn])),
  }
}

export function Setup({
  modeId,
  onBack,
  onStart,
}: {
  modeId: ModeId
  onBack: () => void
  onStart: (config: SprintConfig) => void
}) {
  const mode = getMode(modeId)
  const levels = mode.levels ?? DIFFICULTIES
  const durations = mode.durations ?? DURATIONS
  const [config, setConfig] = useState<SprintConfig>(() => {
    // Merge with defaults so options added in later versions of the app still get a value.
    const defaults = defaultConfig(modeId)
    const last = getLastConfig(modeId)
    const merged = last ? { ...defaults, ...last, options: { ...defaults.options, ...last.options } } : defaults
    const withDuration =
      mode.fixedDuration !== undefined
        ? { ...merged, duration: mode.fixedDuration }
        : durations.includes(merged.duration)
          ? merged
          : { ...merged, duration: defaults.duration }
    // A saved level this mode doesn't offer (e.g. Medium for Audit) falls back to the default.
    return levels.includes(withDuration.difficulty)
      ? withDuration
      : { ...withDuration, difficulty: defaults.difficulty }
  })
  const best = getBest(config)
  const recent = getRecentRounds(config)
  const instructions = INSTRUCTIONS[modeId]
  // Show How to play automatically until someone has played a mode, unless they turned it off.
  const [showHelp, setShowHelp] = useState(() => !hasPlayed(modeId) && !isHowToPlayHidden(modeId))
  const enabledCount = Object.values(config.options).filter(Boolean).length

  const toggleOption = (id: string) => {
    const on = !config.options[id]
    // Never let the player switch off the last remaining option.
    if (!on && enabledCount <= 1) return
    setConfig({ ...config, options: { ...config.options, [id]: on } })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-baseline justify-between">
        <TextButton onClick={onBack}>← Back</TextButton>
        {instructions && <TextButton onClick={() => setShowHelp(true)}>How to play</TextButton>}
      </div>

      <h1 className="pb-8 pt-8 text-4xl font-bold tracking-tight">{mode.name}</h1>

      {instructions && showHelp && (
        <HowToPlay
          modeId={modeId}
          modeName={mode.name}
          instructions={instructions}
          onClose={() => setShowHelp(false)}
        />
      )}

      <div>
        {mode.fixedDuration === undefined && (
          <OptionRow
            label="Time"
            value={config.duration}
            options={durations.map((d) => ({ value: d, label: `${d}s` }))}
            onChange={(duration) => setConfig({ ...config, duration })}
          />
        )}
        <OptionRow
          label="Level"
          value={config.difficulty}
          options={levels.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }))}
          onChange={(difficulty) => setConfig({ ...config, difficulty })}
        />

        {mode.options && (
          <div role="group" aria-label="Include" className="flex items-baseline gap-4 py-3">
            <span className="w-24 shrink-0 text-sm text-muted">Include</span>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {mode.options.map((o) => {
                const on = !!config.options[o.id]
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={o.title}
                    title={o.title}
                    onClick={() => toggleOption(o.id)}
                    className={`py-1 text-lg transition-colors ${
                      on ? 'font-semibold text-accent' : 'text-muted line-through decoration-1 hover:text-fg'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <RecentRuns runs={recent} />
      </div>

      {/* Start button stays pinned to the bottom, within thumb reach. */}
      <div className="sticky bottom-0 -mx-4 mt-auto bg-bg px-4 pb-1 pt-6">
        <p className="mb-3 h-5 text-center text-sm text-muted">
          {best !== null && (
            <>
              Personal best <span className="text-fg">{best}</span>
            </>
          )}
        </p>
        <Button className="w-full" onClick={() => onStart(config)}>
          Start
        </Button>
      </div>
    </div>
  )
}
