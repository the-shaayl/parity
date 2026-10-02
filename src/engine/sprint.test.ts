import { describe, expect, it } from 'vitest'
import { initialSprintState, sprintReducer, summarize } from './sprint'
import type { Question } from './types'

const typed = (answer: number): Question => ({ prompt: `${answer}`, answer, input: 'type', tag: 't' })
const choice = (answer: number): Question => ({
  prompt: 'q',
  answer,
  input: 'choice',
  choices: [answer, answer + 1, answer + 2, answer + 3],
  tag: 'c',
})

describe('sprintReducer', () => {
  it('advances automatically once the typed answer is right', () => {
    let s = sprintReducer(initialSprintState(typed(12)), { type: 'start', now: 0 })
    s = sprintReducer(s, { type: 'key', key: '1', now: 500, next: typed(5) })
    expect(s.records).toHaveLength(0)
    expect(s.input).toBe('1')
    s = sprintReducer(s, { type: 'key', key: '2', now: 900, next: typed(5) })
    expect(s.records).toEqual([{ question: typed(12), correct: true, skipped: false, ms: 900 }])
    expect(s.question.answer).toBe(5)
    expect(s.input).toBe('')
    expect(s.feedback?.kind).toBe('correct')
  })

  it('records a wrong multiple-choice tap as a miss and moves on', () => {
    let s = sprintReducer(initialSprintState(choice(10)), { type: 'start', now: 0 })
    s = sprintReducer(s, { type: 'choose', value: 11, now: 300, next: choice(20) })
    expect(s.records[0]).toMatchObject({ correct: false, given: 11 })
    expect(s.feedback?.kind).toBe('wrong')
    expect(s.question.answer).toBe(20)
  })

  it('skips', () => {
    let s = sprintReducer(initialSprintState(typed(3)), { type: 'start', now: 0 })
    s = sprintReducer(s, { type: 'skip', now: 100, next: typed(4) })
    expect(s.records[0]).toMatchObject({ correct: false, skipped: true })
  })

  it('ignores the wrong kind of input', () => {
    const s = initialSprintState(choice(10))
    expect(sprintReducer(s, { type: 'key', key: '1', now: 0, next: typed(1) })).toBe(s)
  })
})

describe('summarize', () => {
  it('computes score, accuracy and average time of correct answers', () => {
    const q = typed(1)
    const result = summarize([
      { question: q, correct: true, skipped: false, ms: 1000 },
      { question: q, correct: true, skipped: false, ms: 3000 },
      { question: q, correct: false, skipped: true, ms: 9000 },
    ])
    expect(result).toEqual({ score: 2, attempted: 3, accuracy: 2 / 3, avgCorrectMs: 2000 })
  })
})
