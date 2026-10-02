import { useState } from 'react'
import { Icons } from '../components/icons'
import { Button, IconButton, Segmented } from '../components/ui'
import { DIFFICULTIES, DURATIONS, type ModeId, type SprintConfig } from '../engine/types'
import { getMode } from '../modes'
import { getBest, getLastConfig } from '../storage/stats'

function defaultConfig(modeId: ModeId): SprintConfig {
  const mode = getMode(modeId)
  return {
    modeId,
    difficulty: 'medium',
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
  const [config, setConfig] = useState<SprintConfig>(() => {
    // Merge with defaults so options added in later versions of the app still get a value.
    const defaults = defaultConfig(modeId)
    const last = getLastConfig(modeId)
    return last ? { ...defaults, ...last, options: { ...defaults.options, ...last.options } } : defaults
  })
  const best = getBest(config)
  const enabledCount = Object.values(config.options).filter(Boolean).length

  const toggleOption = (id: string) => {
    const on = !config.options[id]
    // Never let the player switch off the last remaining option.
    if (!on && enabledCount <= 1) return
    setConfig({ ...config, options: { ...config.options, [id]: on } })
  }

  return (
    <div className="anim-pop flex flex-1 flex-col">
      <div className="mb-6 flex items-center">
        <IconButton label="Back" onClick={onBack}>
          <Icons.back />
        </IconButton>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{mode.name}</h1>
      <p className="mt-2 text-muted">{mode.description}</p>

      <div className="mt-8 flex flex-col gap-6">
        <Segmented
          label="Round length"
          value={config.duration}
          options={DURATIONS.map((d) => ({ value: d, label: d < 60 ? `${d}s` : `${d / 60} min` }))}
          onChange={(duration) => setConfig({ ...config, duration })}
        />
        <Segmented
          label="Difficulty"
          value={config.difficulty}
          options={DIFFICULTIES.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }))}
          onChange={(difficulty) => setConfig({ ...config, difficulty })}
        />

        {mode.options && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-muted">Include</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                    className={`h-12 rounded-xl border text-lg font-semibold transition ${
                      on
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-border bg-surface text-muted hover:text-fg'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      </div>

      <div className="mt-auto pt-10">
        <p className="mb-3 flex h-5 items-center justify-center gap-1.5 text-sm text-muted">
          {best !== null && (
            <>
              <Icons.trophy /> Personal best: <span className="font-semibold text-fg">{best}</span>
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
