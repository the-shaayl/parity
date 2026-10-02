import { pick } from '../../engine/rng'
import type { Difficulty, GeneratorContext, Question } from '../../engine/types'

/*
 * Clock: a time is shown as digits and on a clock face. The player types the smaller angle
 * between the hour and minute hands, from 0 to 180 degrees.
 */

export const CLOCK_LEVELS: Difficulty[] = ['easy', 'hard']

/** Minutes past the hour used at each level. Easy answers are multiples of 15; Hard can end in .5. */
const MINUTES: Partial<Record<Difficulty, number[]>> = {
  easy: [0, 30],
  hard: [0, 15, 30, 45],
}

/**
 * The smaller angle between the hands. The hour hand moves as the minutes pass,
 * so at 7:30 it sits halfway between 7 and 8.
 */
export function clockAngle(hour: number, minute: number): number {
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const minuteAngle = minute * 6
  const diff = Math.abs(hourAngle - minuteAngle)
  return Math.min(diff, 360 - diff)
}

/** "7:30", "12:15": 12-hour, no leading zero, no AM/PM. */
export function formatTime(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, '0')}`
}

/** Every time a level can show. 12:00 is left out: both hands overlap, so it is a giveaway. */
export function clockTimes(difficulty: Difficulty): { hour: number; minute: number }[] {
  const minutes = MINUTES[difficulty] ?? MINUTES.easy!
  const times = []
  for (let hour = 1; hour <= 12; hour++) {
    for (const minute of minutes) if (!(hour === 12 && minute === 0)) times.push({ hour, minute })
  }
  return times
}

const TAGS: Record<number, string> = { 0: 'hour', 30: 'half', 15: 'quarter', 45: 'quarter' }

export function generateClock({ difficulty, rng, previous }: GeneratorContext): Question {
  // Never the same time twice in a row.
  const times = clockTimes(difficulty).filter((t) => formatTime(t.hour, t.minute) !== previous?.prompt)
  const { hour, minute } = pick(rng, times)
  return {
    prompt: formatTime(hour, minute),
    time: { hour, minute },
    answer: clockAngle(hour, minute),
    unit: '°',
    input: 'type',
    tag: TAGS[minute],
  }
}
