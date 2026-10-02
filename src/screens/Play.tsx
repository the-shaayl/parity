import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { Keypad } from '../components/Keypad'
import { Icons } from '../components/icons'
import { IconButton } from '../components/ui'
import type { Key } from '../engine/checkAnswer'
import { initialSprintState, sprintReducer } from '../engine/sprint'
import type { Question, RoundResult, SprintConfig } from '../engine/types'
import { formatNumber } from '../lib/format'
import { tap } from '../lib/haptics'
import { getMode } from '../modes'

const COUNTDOWN_FROM = 3
const KEYS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '-'])

export function Play({
  config,
  onQuit,
  onFinish,
}: {
  config: SprintConfig
  onQuit: () => void
  onFinish: (result: RoundResult) => void
}) {
  const mode = getMode(config.modeId)
  const keypad = mode.keypad?.(config.difficulty) ?? { decimal: true, negative: true }

  const generate = useCallback(
    (previous?: Question) =>
      mode.generate!({ difficulty: config.difficulty, options: config.options, rng: Math.random, previous }),
    [mode, config.difficulty, config.options],
  )

  const [state, dispatch] = useReducer(sprintReducer, undefined, () => initialSprintState(generate()))
  const [phase, setPhase] = useState<'countdown' | 'playing'>('countdown')
  const [count, setCount] = useState(COUNTDOWN_FROM)
  const [secondsLeft, setSecondsLeft] = useState<number>(config.duration)

  // The timer callback needs the latest answers, not the ones from when it was created.
  const stateRef = useRef(state)
  const onFinishRef = useRef(onFinish)
  useLayoutEffect(() => {
    stateRef.current = state
    onFinishRef.current = onFinish
  })
  const finished = useRef(false)

  // 3-2-1 countdown before the round starts.
  useEffect(() => {
    if (phase !== 'countdown') return
    const t = setTimeout(() => {
      if (count > 1) {
        setCount(count - 1)
      } else {
        dispatch({ type: 'start', now: performance.now() })
        setPhase('playing')
      }
    }, 700)
    return () => clearTimeout(t)
  }, [phase, count])

  // Round clock. Measured against a fixed end time so it stays accurate even if the
  // browser delays timers (e.g. when the app is briefly in the background).
  useEffect(() => {
    if (phase !== 'playing') return
    const endAt = performance.now() + config.duration * 1000
    const interval = setInterval(() => {
      const left = endAt - performance.now()
      setSecondsLeft(Math.max(0, Math.ceil(left / 1000)))
      if (left <= 0 && !finished.current) {
        finished.current = true
        clearInterval(interval)
        onFinishRef.current({ config, records: stateRef.current.records, finishedAt: Date.now() })
      }
    }, 100)
    return () => clearInterval(interval)
  }, [phase, config])

  const playing = phase === 'playing'
  const { question } = state

  const press = (key: Key) => {
    if (!playing) return
    dispatch({ type: 'key', key, now: performance.now(), next: generate(question) })
  }
  const choose = (value: number) => {
    if (!playing) return
    tap()
    dispatch({ type: 'choose', value, now: performance.now(), next: generate(question) })
  }
  const skip = () => {
    if (!playing) return
    dispatch({ type: 'skip', now: performance.now(), next: generate(question) })
  }

  // Physical keyboard support (laptops, tablets with keyboards).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ') {
        e.preventDefault()
        skip()
      } else if (question.input === 'choice') {
        const i = Number(e.key) - 1
        if (question.choices && i >= 0 && i < question.choices.length) choose(question.choices[i])
      } else if (KEYS.has(e.key)) {
        press(e.key as Key)
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        press('back')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const score = state.records.filter((r) => r.correct).length
  const lowTime = playing && secondsLeft <= 5
  const flash =
    state.feedback?.kind === 'correct' ? 'anim-correct' : state.feedback?.kind === 'wrong' ? 'anim-wrong' : ''

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      {/* Top bar: quit, time remaining, score */}
      <div className="flex items-center gap-4">
        <IconButton label="Quit round" onClick={onQuit}>
          <Icons.close />
        </IconButton>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
          role="timer"
          aria-label={`${secondsLeft} seconds left`}
        >
          <div
            className={`h-full origin-left rounded-full transition-colors ${lowTime ? 'bg-danger' : 'bg-accent'}`}
            style={playing ? { animation: `drain ${config.duration}s linear forwards` } : undefined}
          />
        </div>
        <div className={`w-8 text-right text-sm font-semibold ${lowTime ? 'text-danger' : 'text-muted'}`}>
          {secondsLeft}s
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between text-sm text-muted">
        <span>{mode.name}</span>
        <span>
          Score <span className="text-lg font-bold text-fg">{score}</span>
        </span>
      </div>

      {/* Question */}
      <div className="flex flex-1 items-center justify-center py-6">
        {playing ? (
          <div
            key={state.feedback?.seq ?? 0}
            className={`w-full rounded-3xl border-2 border-transparent px-4 py-10 text-center ${flash}`}
          >
            <p className="text-5xl font-semibold tracking-tight break-words sm:text-6xl" aria-live="polite">
              {question.prompt}
            </p>
          </div>
        ) : (
          <p key={count} className="anim-pop text-7xl font-bold text-accent" aria-live="assertive">
            {count}
          </p>
        )}
      </div>

      {/* Answer area */}
      <div className={playing ? '' : 'pointer-events-none opacity-40'}>
        {question.input === 'type' ? (
          <>
            <div className="mb-3 flex h-16 items-center rounded-2xl border border-border bg-surface pl-5 pr-2">
              <output className="flex-1 text-3xl font-semibold" aria-label="Your answer">
                {state.input ? state.input.replace('-', '−') : <span className="text-muted/50">?</span>}
                {mode.unit && <span className="ml-1 text-muted">{mode.unit}</span>}
              </output>
              <button
                type="button"
                aria-label="Delete"
                onPointerDown={(e) => {
                  e.preventDefault()
                  press('back')
                }}
                className="flex size-12 items-center justify-center rounded-xl text-muted active:bg-surface-2"
              >
                <Icons.backspace />
              </button>
            </div>
            <div className="pointer-fine:hidden">
              <Keypad onKey={press} decimal={keypad.decimal} negative={keypad.negative} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {question.choices?.map((c, i) => (
              <button
                key={`${state.feedback?.seq}-${c}`}
                type="button"
                onClick={() => choose(c)}
                className="relative h-16 rounded-2xl border border-border bg-surface text-xl font-semibold transition active:scale-[0.98] active:bg-surface-2"
              >
                <span className="absolute left-3 top-2 hidden text-xs text-muted pointer-fine:block">{i + 1}</span>
                {formatNumber(c)}
                {mode.unit}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span className="hidden pointer-fine:inline">
            {question.input === 'type' ? 'Type your answer' : 'Press 1–4'} · Space to skip
          </span>
          <button type="button" onClick={skip} className="-mx-3 ml-auto rounded-lg px-3 py-2 font-medium hover:text-fg">
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
