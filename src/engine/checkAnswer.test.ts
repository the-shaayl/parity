import { describe, expect, it } from 'vitest'
import { applyKey, isCorrectTyped, parseTyped, type Key } from './checkAnswer'

const type = (keys: Key[]) => keys.reduce(applyKey, '')

describe('applyKey', () => {
  it('builds numbers digit by digit', () => {
    expect(type(['1', '2', '3'])).toBe('123')
  })
  it('handles decimals and a single decimal point', () => {
    expect(type(['.', '5'])).toBe('0.5')
    expect(type(['3', '7', '.', '.', '5'])).toBe('37.5')
  })
  it('toggles the minus sign at the front', () => {
    expect(type(['4', '-'])).toBe('-4')
    expect(type(['4', '-', '-'])).toBe('4')
  })
  it('does not produce leading zeros', () => {
    expect(type(['0', '7'])).toBe('7')
  })
  it('backspaces', () => {
    expect(type(['1', '2', 'back'])).toBe('1')
    expect(type(['back'])).toBe('')
  })
  it('caps length', () => {
    expect(type(Array(20).fill('9') as Key[]).length).toBe(10)
  })
})

describe('checking answers', () => {
  it('rejects incomplete input', () => {
    expect(parseTyped('')).toBeNull()
    expect(parseTyped('-')).toBeNull()
    expect(parseTyped('12.')).toBeNull()
  })
  it('accepts exact matches including decimals and negatives', () => {
    expect(isCorrectTyped('37.5', 37.5)).toBe(true)
    expect(isCorrectTyped('-4', -4)).toBe(true)
    expect(isCorrectTyped('0.3', 0.1 + 0.2)).toBe(true)
    expect(isCorrectTyped('37', 37.5)).toBe(false)
  })
})
