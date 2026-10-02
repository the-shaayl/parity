import type { ModeId } from '../engine/types'

/**
 * "How to play" text. Every mode uses the same two sections in the same order: Goal and
 * How to answer. Plain words and short sentences.
 */
export interface Instructions {
  goal: string
  answer: string[]
}

const TYPE_IT = 'Type your answer. It moves on as soon as it is right.'

export const INSTRUCTIONS: Partial<Record<ModeId, Instructions>> = {
  arithmetic: {
    goal: 'Answer as many questions as you can before time runs out.',
    answer: [
      'Solve each question, like 9 × 7 = 63.',
      TYPE_IT,
      'Use Include to choose your operations, including powers like 12² and factorials like 5!.',
    ],
  },
  percent: {
    goal: 'Answer as many questions as you can before time runs out.',
    answer: [
      'Work out the percentage, like 25% of 240 = 36.',
      'The small label above a question, like Sale price, tells you what to find.',
      TYPE_IT,
      'Answers are always whole numbers.',
    ],
  },
  rush: {
    goal: 'Hit as many targets as you can before time runs out.',
    answer: [
      'Tap a number, then +, −, × or ÷, then another number. The two become one new number.',
      'Keep going until you hit the target. You do not have to use every number.',
      'Close enough? Tap Submit to lock in the number you have selected.',
      'No negative numbers, and division has to come out even.',
      'Exact hits score 3 points. Close answers score 1 or 2.',
    ],
  },
  audit: {
    goal: 'Get as many right in a row as you can. One mistake ends the run.',
    answer: [
      'Tap ✓ if the equation is right, or ✗ if it is wrong, like 7 × 8 = 54 is wrong.',
      'You get a few seconds for each one. Running out of time ends the run too.',
      'The longer you last, the less time you get and the closer the wrong answers look.',
      'Easy uses + and −. Hard adds × and ÷.',
    ],
  },
  clock: {
    goal: 'Answer as many questions as you can before time runs out.',
    answer: [
      'Type the smaller angle between the two hands in degrees, like 3:00 = 90.',
      'The hour hand moves as the minutes pass, so at 7:30 it sits halfway between 7 and 8.',
      TYPE_IT,
      'Easy uses the hour and half hour. Hard adds quarter hours, so some answers end in .5.',
    ],
  },
}
