import { describe, expect, it } from 'vitest'
import type { SprintConfig } from '../engine/types'
import { chaseBestMessage, paceMessage } from './pace'
import { shareText } from './share'

describe('paceMessage', () => {
  it('says nothing without a best, or in the first few seconds', () => {
    expect(paceMessage(3, null, 30, 60)).toBeNull()
    expect(paceMessage(3, 0, 30, 60)).toBeNull()
    expect(paceMessage(1, 30, 4, 60)).toBeNull()
  })
  it('compares against an even pace towards the best', () => {
    // Best 30 in 60s: on pace for 15 at the halfway mark.
    expect(paceMessage(17, 30, 30, 60)).toEqual({ text: '2 ahead of best', tone: 'ahead' })
    expect(paceMessage(14, 30, 30, 60)).toEqual({ text: '1 behind best', tone: 'behind' })
    expect(paceMessage(15, 30, 30, 60)).toEqual({ text: 'Level with best', tone: 'level' })
  })
  it('never expects more than the best itself', () => {
    expect(paceMessage(30, 30, 75, 60)).toEqual({ text: 'Level with best', tone: 'level' })
  })
})

describe('chaseBestMessage (Audit)', () => {
  it('shows the best until it is passed', () => {
    expect(chaseBestMessage(5, null)).toBeNull()
    expect(chaseBestMessage(5, 12)).toEqual({ text: 'Best 12', tone: 'level' })
    expect(chaseBestMessage(12, 12)).toEqual({ text: 'Best 12', tone: 'level' })
    expect(chaseBestMessage(13, 12)).toEqual({ text: 'New best', tone: 'ahead' })
  })
})

describe('shareText', () => {
  const config = (difficulty: SprintConfig['difficulty'], duration: SprintConfig['duration']): SprintConfig => ({
    modeId: 'arithmetic',
    difficulty,
    duration,
    options: {},
  })
  it('reads naturally for each kind of mode', () => {
    expect(shareText('Blitz', undefined, config('hard', 60), 34)).toBe(
      'Pack it up, you just got Parity mogged. 34 on Blitz (Hard, 60s).',
    )
    expect(shareText('Rush', 'rush', config('medium', 120), 1)).toBe(
      'Pack it up, you just got Parity mogged. 1 point on Rush (Medium, 120s).',
    )
    expect(shareText('Audit', 'audit', config('easy', 0), 23)).toBe(
      'Pack it up, you just got Parity mogged. 23 in a row on Audit (Easy).',
    )
  })
  it('never uses em dashes or dot separators', () => {
    const text = shareText('Rush', 'rush', config('hard', 120), 9)
    expect(text).not.toMatch(/[—·]/)
  })
})
