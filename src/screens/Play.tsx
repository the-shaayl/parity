import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react'
import { Keypad } from '../components/Keypad'
import { Icons } from '../components/icons'
import type { Key } from '../engine/checkAnswer'
import { initialSprintState, sprintReducer } from '../engine/sprint'
import { useRoundClock } from '../engine/useRoundClock'
import type { Question, RoundResult, SprintConfig } from '../engine/types'
import { formatAnswer } from '../lib/format'
import { tap } from '../lib/haptics'
import { getMode } from '../modes'

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
  // The end-of-round callback needs the latest answers, not the ones from when it was created.
  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  })

  const { count, secondsLeft, playing } = useRoundClock(
    config.duration,
    (now) => dispatch({ type: 'start', now }),
    () => onFinish({ config, records: stateRef.current.records, finishedAt: Date.now() }),
  )
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
      if (e.key === 'Escape') {
        onQuit()
      } else if (e.key === ' ') {
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
  const unit = question.unit ?? mode.unit
  const prefix = question.prefix
  const kind = state.feedback?.kind
  const seq = state.feedback?.seq ?? 0

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      {/* Top line: time left, mode, score */}
      <div className="flex items-baseline justify-between">
        <span
          className={`w-16 text-3xl font-semibold ${lowTime ? 'anim-low-time text-danger' : 'text-accent'}`}
          role="timer"
          aria-label={`${secondsLeft} seconds left`}
        >
          {secondsLeft}
        </span>
        <span className="text-sm text-muted">{mode.name}</span>
        <span className="w-16 text-right text-3xl font-semibold" aria-label={`Score ${score}`}>
          {score}
        </span>
      </div>
      <div className="mt-3 h-px bg-border">
        <div
          className={`h-px origin-left ${lowTime ? 'bg-danger' : 'bg-accent'}`}
          style={{ animation: playing ? `drain ${config.duration}s linear forwards` : undefined }}
        />
      </div>

      {/* Question */}
      <div className="flex flex-1 items-center justify-center py-6">
        {playing ? (
          <div key={`q-${seq}`} className={`w-full text-center ${kind === 'wrong' ? 'anim-shake' : 'anim-question'}`}>
            {question.label && <p className="mb-4 text-sm text-muted">{question.label}</p>}
            <p
              className={`font-semibold leading-none tracking-tight break-words ${promptSize(question.prompt)}`}
              aria-live="polite"
            >
              {question.prompt}
            </p>
          </div>
        ) : (
          <p key={`count-${count}`} className="text-7xl font-semibold text-accent" aria-live="assertive">
            {count}
          </p>
        )}
      </div>

      {/* Answer area. Fixed height on touch screens, so switching between typed and
          multiple-choice questions doesn't make the layout jump. */}
      <div
        className={`flex min-h-[324px] flex-col justify-end sm:min-h-[356px] pointer-fine:min-h-0 ${playing ? '' : 'pointer-events-none opacity-40'}`}
      >
        {question.input === 'type' ? (
          <>
            <div className="mb-4 flex h-16 items-center border-b-2 border-border">
              <output
                className="flex flex-1 items-center justify-center pl-12 text-4xl font-semibold"
                aria-label="Your answer"
              >
                {prefix && <span className="mr-1 text-muted">{prefix}</span>}
                {state.input ? state.input.replace('-', '−') : null}
                {playing && <span className="anim-caret mx-0.5 inline-block h-9 w-[2px] bg-accent" />}
                {unit && <span className="ml-1 text-muted">{unit}</span>}
              </output>
              <button
                type="button"
                aria-label="Delete"
                onPointerDown={(e) => {
                  e.preventDefault()
                  press('back')
                }}
                className="flex size-12 items-center justify-center text-muted active:text-fg"
              >
                <Icons.backspace />
              </button>
            </div>
            <div className="pointer-fine:hidden">
              <Keypad onKey={press} decimal={keypad.decimal} negative={keypad.negative} />
            </div>
          </>
        ) : (
          <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-px border border-border bg-border pointer-fine:flex-none">
            {question.choices?.map((c, i) => (
              <button
                key={`${seq}-${c}`}
                type="button"
                onClick={() => choose(c)}
                className="relative min-h-16 bg-bg text-2xl font-semibold transition-colors hover:text-accent active:bg-surface-2"
              >
                <span className="absolute left-3 top-2 hidden text-xs text-muted pointer-fine:block">{i + 1}</span>
                {formatAnswer(question, c, mode.unit)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom line: skip on the left, back (leave the round) on the right. Kept outside the
          answer area so Back still works during the 3-2-1 countdown. */}
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <button
          type="button"
          onClick={skip}
          disabled={!playing}
          className="-mx-2 px-2 py-2 hover:text-fg disabled:opacity-40"
        >
          Skip
        </button>
        <span className="hidden pointer-fine:inline">
          {question.input === 'type' ? 'Type your answer' : 'Press 1–4'}, space to skip, esc to go back
        </span>
        <button type="button" onClick={onQuit} className="-mx-2 px-2 py-2 hover:text-fg">
          Back
        </button>
      </div>
    </div>
  )
}

/** Longer prompts get a smaller font so they still fit on one or two lines on a phone. */
function promptSize(prompt: string): string {
  if (prompt.length <= 9) return 'text-[3.5rem] sm:text-7xl'
  if (prompt.length <= 13) return 'text-[2.75rem] sm:text-6xl'
  if (prompt.length <= 17) return 'text-[2.25rem] sm:text-5xl'
  return 'text-[1.9rem] sm:text-4xl'
}
