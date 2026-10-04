import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import type { AnswerRecord, RoundResult, SprintConfig } from '../engine/types'
import { useRoundClock } from '../engine/useRoundClock'
import { PaceLine } from '../components/PaceLine'
import { chaseBestMessage } from '../lib/pace'
import { getBest } from '../storage/stats'
import { formatNumber } from '../lib/format'
import { tap } from '../lib/haptics'
import { generateAudit, windowMs, type AuditQuestion } from '../modes/audit/engine'

/** How long the final equation stays on screen after a miss, before the results appear. */
const END_PAUSE_MS = 1100

interface AuditState {
  question: AuditQuestion
  records: AnswerRecord[]
  shownAt: number
  /** Set when the run is over: why, and the question it ended on. */
  over: { reason: 'wrong' | 'time' } | null
}

type Action =
  | { type: 'start'; now: number }
  | { type: 'answer'; saysTrue: boolean; now: number; next: AuditQuestion }
  | { type: 'timeout'; now: number }

const score = (records: AnswerRecord[]) => records.filter((r) => r.correct).length

function toRecord(q: AuditQuestion, correct: boolean, ms: number, saysTrue: boolean | null): AnswerRecord {
  return {
    question: {
      prompt: `${q.left} = ${formatNumber(q.shown)}`,
      answer: q.isTrue ? 1 : 0,
      input: 'choice',
      tag: q.op,
    },
    correct,
    skipped: saysTrue === null,
    ms,
    given: saysTrue === null ? undefined : saysTrue ? 1 : 0,
  }
}

function reducer(state: AuditState, action: Action): AuditState {
  if (state.over) return state
  switch (action.type) {
    case 'start':
      return { ...state, shownAt: action.now }
    case 'answer': {
      const correct = action.saysTrue === state.question.isTrue
      const record = toRecord(state.question, correct, action.now - state.shownAt, action.saysTrue)
      if (!correct) return { ...state, records: [...state.records, record], over: { reason: 'wrong' } }
      return { question: action.next, records: [...state.records, record], shownAt: action.now, over: null }
    }
    case 'timeout':
      // Running out of time counts exactly like a wrong answer.
      return {
        ...state,
        records: [...state.records, toRecord(state.question, false, action.now - state.shownAt, null)],
        over: { reason: 'time' },
      }
  }
}

export function AuditPlay({
  config,
  onQuit,
  onFinish,
}: {
  config: SprintConfig
  onQuit: () => void
  onFinish: (result: RoundResult) => void
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    question: generateAudit(config.difficulty, 0, Math.random),
    records: [],
    shownAt: 0,
    over: null,
  }))
  const stateRef = useRef(state)
  const finishRef = useRef(() => onFinish({ config, records: stateRef.current.records, finishedAt: Date.now() }))
  useLayoutEffect(() => {
    stateRef.current = state
    finishRef.current = () => onFinish({ config, records: stateRef.current.records, finishedAt: Date.now() })
  })

  // Audit has no round clock: the run ends on the first mistake. The hook still runs the 3-2-1.
  const { count, playing } = useRoundClock(
    0,
    (now) => dispatch({ type: 'start', now }),
    () => {},
  )

  const current = score(state.records)
  const [best] = useState(() => getBest(config))
  const limit = windowMs(config.difficulty, current)
  const active = playing && !state.over

  // Each equation gets its own time limit; running out ends the run.
  const questionKey = state.records.length
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => dispatch({ type: 'timeout', now: performance.now() }), limit)
    return () => clearTimeout(t)
  }, [active, questionKey, limit])

  // After a miss, leave the equation up briefly so the player sees why, then show results.
  useEffect(() => {
    if (!state.over) return
    const t = setTimeout(() => finishRef.current(), END_PAUSE_MS)
    return () => clearTimeout(t)
  }, [state.over])

  const answer = (saysTrue: boolean) => {
    if (!active) return
    tap()
    dispatch({
      type: 'answer',
      saysTrue,
      now: performance.now(),
      next: generateAudit(config.difficulty, current + 1, Math.random, state.question),
    })
  }

  // Keyboard: left arrow or X for false, right arrow or C for true, Esc to leave.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') onQuit()
      else if (e.key === 'ArrowLeft' || e.key === 'x') answer(false)
      else if (e.key === 'ArrowRight' || e.key === 'c') answer(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const { question, over } = state
  const equation = `${question.left} = ${formatNumber(question.shown)}`

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      {/* Top line: mode and score */}
      <div className="flex items-baseline justify-between">
        <span className="w-16" />
        <span className="text-sm text-muted">Audit</span>
        <span className="w-16 text-right text-3xl font-semibold" aria-label={`Score ${current}`}>
          {current}
        </span>
      </div>
      {/* Time left for this equation; restarts with every new one */}
      <div className="mt-3 h-px bg-border">
        {active && (
          <div
            key={questionKey}
            className="h-px origin-left bg-accent"
            style={{ animation: `drain ${limit}ms linear forwards` }}
          />
        )}
      </div>
      <PaceLine message={playing ? chaseBestMessage(current, best) : null} />

      {/* Equation */}
      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        {playing ? (
          <>
            <p
              key={`q-${questionKey}`}
              className={`text-[2.75rem] font-semibold leading-none tracking-tight sm:text-6xl ${over ? 'anim-shake' : 'anim-question'}`}
              aria-live="polite"
            >
              {equation}
            </p>
            <p className="mt-4 h-5 text-sm text-danger" aria-live="assertive">
              {over &&
                (over.reason === 'time'
                  ? `Out of time. It was ${question.isTrue ? 'true' : 'false'}.`
                  : `It was ${question.isTrue ? 'true' : 'false'}.`)}
            </p>
          </>
        ) : (
          <p className="text-7xl font-semibold text-accent" aria-live="assertive">
            {count}
          </p>
        )}
      </div>

      {/* False / True */}
      <div className="grid grid-cols-2 gap-px border border-border bg-border" role="group" aria-label="Is it right?">
        <button
          type="button"
          disabled={!active}
          onClick={() => answer(false)}
          aria-label="False"
          className="flex h-28 flex-col items-center justify-center gap-1 bg-bg text-fg transition-colors active:bg-surface-2 disabled:text-muted/40"
        >
          <span className="text-4xl" aria-hidden>
            ✗
          </span>
          <span className="text-sm text-muted">False</span>
        </button>
        <button
          type="button"
          disabled={!active}
          onClick={() => answer(true)}
          aria-label="True"
          className="flex h-28 flex-col items-center justify-center gap-1 bg-bg text-fg transition-colors active:bg-surface-2 disabled:text-muted/40"
        >
          <span className="text-4xl" aria-hidden>
            ✓
          </span>
          <span className="text-sm text-muted">True</span>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span className="hidden pointer-fine:inline">Left arrow for false, right arrow for true</span>
        <button type="button" onClick={onQuit} className="-mx-2 ml-auto px-2 py-2 hover:text-fg">
          Back
        </button>
      </div>
    </div>
  )
}
