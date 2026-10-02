import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import type { AnswerRecord, RoundResult, SprintConfig } from '../engine/types'
import { useRoundClock } from '../engine/useRoundClock'
import { formatNumber } from '../lib/format'
import { tap } from '../lib/haptics'
import { applyOperation, generateRushPuzzle, OPS, pointsFor, type Op, type RushPuzzle } from '../modes/rush/engine'

interface Chip {
  id: number
  value: number
}

/** Four fixed slots; a slot empties when its number is merged into another. */
type Slots = (Chip | null)[]

interface Feedback {
  text: string
  good: boolean
  seq: number
}

interface RushState {
  puzzle: RushPuzzle
  initial: Slots
  slots: Slots
  history: { text: string; before: Slots }[]
  selected: number | null
  op: Op | null
  records: AnswerRecord[]
  puzzleStartedAt: number
  nextId: number
  feedback: Feedback | null
}

type Action =
  | { type: 'start'; now: number }
  | { type: 'chip'; id: number; now: number; next: RushPuzzle }
  | { type: 'op'; op: Op }
  | { type: 'undo' }
  | { type: 'restart' }
  | { type: 'skip'; now: number; next: RushPuzzle }

function load(puzzle: RushPuzzle, firstId: number) {
  const slots = puzzle.numbers.map((value, i) => ({ id: firstId + i, value }))
  return { puzzle, initial: slots, slots, history: [], selected: null, op: null, nextId: firstId + slots.length }
}

function initialState(puzzle: RushPuzzle): RushState {
  return { ...load(puzzle, 0), records: [], puzzleStartedAt: 0, feedback: null }
}

const OP_LABEL: Record<Op, string> = { '+': '+', '-': '−', '×': '×', '÷': '÷' }

/** Ends the current puzzle, records how it went, and loads the next one. */
function finishPuzzle(state: RushState, final: number | null, now: number, next: RushPuzzle): RushState {
  const { target, numbers } = state.puzzle
  const skipped = final === null
  const points = skipped ? 0 : pointsFor(final, target)
  const off = skipped ? 0 : Math.abs(final - target)
  const record: AnswerRecord = {
    question: { prompt: `${numbers.join(', ')} → ${target}`, answer: target, input: 'type', tag: 'rush' },
    correct: points === 3,
    skipped,
    ms: now - state.puzzleStartedAt,
    given: final ?? undefined,
    points,
  }
  const text = skipped
    ? 'Skipped'
    : points === 3
      ? 'Exact, +3'
      : `${formatNumber(off)} away${points > 0 ? `, +${points}` : ''}`
  return {
    ...state,
    ...load(next, state.nextId),
    records: [...state.records, record],
    puzzleStartedAt: now,
    feedback: { text, good: points > 0, seq: (state.feedback?.seq ?? 0) + 1 },
  }
}

function reducer(state: RushState, action: Action): RushState {
  switch (action.type) {
    case 'start':
      return { ...state, puzzleStartedAt: action.now }

    case 'op':
      if (state.selected === null) return state
      return { ...state, op: state.op === action.op ? null : action.op }

    case 'undo': {
      const last = state.history[state.history.length - 1]
      if (!last) return state
      return { ...state, slots: last.before, history: state.history.slice(0, -1), selected: null, op: null }
    }

    case 'restart':
      return { ...state, slots: state.initial, history: [], selected: null, op: null }

    case 'skip':
      return finishPuzzle(state, null, action.now, action.next)

    case 'chip': {
      const { selected, op } = state
      // First pick, or changing the first pick before an operation is chosen.
      if (selected === null || (op === null && selected !== action.id)) return { ...state, selected: action.id }
      if (selected === action.id) return { ...state, selected: null, op: null }
      if (op === null) return state

      const aIndex = state.slots.findIndex((c) => c?.id === selected)
      const bIndex = state.slots.findIndex((c) => c?.id === action.id)
      const a = state.slots[aIndex]!
      const b = state.slots[bIndex]!
      const value = applyOperation(a.value, op, b.value)
      if (value === null) return state

      // The result takes the first number's place; the second number's slot empties.
      const result = { id: state.nextId, value }
      const slots = state.slots.map((c, i) => (i === aIndex ? result : i === bIndex ? null : c))
      const moved: RushState = {
        ...state,
        slots,
        history: [...state.history, { text: `${a.value} ${OP_LABEL[op]} ${b.value} = ${value}`, before: state.slots }],
        // Keep the new number selected: most solutions carry on from the last result.
        selected: result.id,
        op: null,
        nextId: state.nextId + 1,
      }
      const remaining = slots.filter(Boolean).length
      if (value === state.puzzle.target || remaining === 1) return finishPuzzle(moved, value, action.now, action.next)
      return moved
    }
  }
}

export function RushPlay({
  config,
  onQuit,
  onFinish,
}: {
  config: SprintConfig
  onQuit: () => void
  onFinish: (result: RoundResult) => void
}) {
  const generate = (previous?: RushPuzzle) => generateRushPuzzle(config.difficulty, Math.random, previous)
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(generate()))

  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  })

  const { count, secondsLeft, playing } = useRoundClock(
    config.duration,
    (now) => dispatch({ type: 'start', now }),
    () => onFinish({ config, records: stateRef.current.records, finishedAt: Date.now() }),
  )

  // Show how the last puzzle went for a moment, then go back to the live distance.
  const [hiddenSeq, setHiddenSeq] = useState(0)
  const feedbackSeq = state.feedback?.seq ?? 0
  useEffect(() => {
    if (!feedbackSeq) return
    const t = setTimeout(() => setHiddenSeq(feedbackSeq), 1300)
    return () => clearTimeout(t)
  }, [feedbackSeq])
  const showFeedback = feedbackSeq > 0 && feedbackSeq !== hiddenSeq

  const { puzzle, slots, selected, op, history } = state
  const selectedValue = slots.find((c) => c?.id === selected)?.value
  const chips = slots.filter((c): c is Chip => c !== null)
  const closest = Math.min(...chips.map((c) => Math.abs(c.value - puzzle.target)))
  const score = state.records.reduce((s, r) => s + (r.points ?? 0), 0)
  const lowTime = playing && secondsLeft <= 5

  const tapChip = (id: number) => {
    if (!playing) return
    tap()
    dispatch({ type: 'chip', id, now: performance.now(), next: generate(puzzle) })
  }
  const tapOp = (o: Op) => playing && dispatch({ type: 'op', op: o })
  const skip = () => playing && dispatch({ type: 'skip', now: performance.now(), next: generate(puzzle) })
  const undo = () => playing && dispatch({ type: 'undo' })
  const restart = () => playing && dispatch({ type: 'restart' })

  /** A number can't be the second pick if the move would break the rules. */
  const illegalAsSecond = (chip: Chip) =>
    selected !== null && op !== null && chip.id !== selected && applyOperation(selectedValue!, op, chip.value) === null

  // Keyboard: 1–4 pick numbers, + − * / pick operations, Backspace undoes, Space skips, Esc leaves.
  useEffect(() => {
    const keyOps: Record<string, Op> = { '+': '+', '-': '-', '*': '×', x: '×', '/': '÷' }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') onQuit()
      else if (e.key === ' ') {
        e.preventDefault()
        skip()
      } else if (e.key === 'Backspace') undo()
      else if (keyOps[e.key]) tapOp(keyOps[e.key])
      else if (/^[1-4]$/.test(e.key)) {
        const chip = slots[Number(e.key) - 1]
        if (chip && !illegalAsSecond(chip)) tapChip(chip.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

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
        <span className="text-sm text-muted">Rush</span>
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

      {/* Target and live distance */}
      <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
        {playing ? (
          <>
            <p className="text-sm text-muted">Target</p>
            <p key={`t-${puzzle.target}-${state.records.length}`} className="anim-question text-7xl font-bold">
              {puzzle.target}
            </p>
            <p className="mt-2 h-5 text-sm" aria-live="polite">
              {showFeedback && state.feedback ? (
                <span className={state.feedback.good ? 'text-accent' : 'text-muted'}>{state.feedback.text}</span>
              ) : (
                <span className="text-muted">{formatNumber(closest)} away</span>
              )}
            </p>
          </>
        ) : (
          <p className="text-7xl font-semibold text-accent" aria-live="assertive">
            {count}
          </p>
        )}
      </div>

      {/* Steps so far */}
      <ol className="mb-3 h-[4.5rem] text-center text-sm leading-6 text-muted" aria-label="Your steps">
        {history.map((h, i) => (
          <li key={i}>{h.text}</li>
        ))}
      </ol>

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-px border border-border bg-border" role="group" aria-label="Numbers">
        {slots.map((chip, i) =>
          chip ? (
            <button
              key={chip.id}
              type="button"
              disabled={!playing || illegalAsSecond(chip)}
              aria-pressed={chip.id === selected}
              onClick={() => tapChip(chip.id)}
              className={`anim-question h-20 text-3xl font-semibold transition-colors disabled:text-muted/40 ${
                chip.id === selected ? 'bg-surface-2 text-accent' : 'bg-bg text-fg active:bg-surface-2'
              }`}
            >
              {playing ? chip.value : ''}
            </button>
          ) : (
            <div key={`empty-${i}`} className="h-20 bg-bg" aria-hidden />
          ),
        )}
      </div>

      {/* Operations */}
      <div className="mt-3 grid grid-cols-4 gap-px border border-border bg-border" role="group" aria-label="Operations">
        {OPS.map((o) => (
          <button
            key={o}
            type="button"
            disabled={!playing || selected === null}
            aria-pressed={op === o}
            onClick={() => tapOp(o)}
            className={`h-14 text-2xl transition-colors disabled:text-muted/40 ${
              op === o ? 'bg-surface-2 font-semibold text-accent' : 'bg-bg text-fg active:bg-surface-2'
            }`}
          >
            {OP_LABEL[o]}
          </button>
        ))}
      </div>

      {/* Bottom line */}
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <button
          type="button"
          onClick={skip}
          disabled={!playing}
          className="-mx-2 px-2 py-2 hover:text-fg disabled:opacity-40"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={!playing || history.length === 0}
          className="px-2 py-2 hover:text-fg disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={restart}
          disabled={!playing || history.length === 0}
          className="px-2 py-2 hover:text-fg disabled:opacity-40"
        >
          Restart
        </button>
        <button type="button" onClick={onQuit} className="-mx-2 px-2 py-2 hover:text-fg">
          Back
        </button>
      </div>
    </div>
  )
}
