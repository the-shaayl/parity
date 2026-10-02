import type { ModeId } from '../engine/types'

/**
 * "How to play" text. Every mode uses the same three sections, in the same order, with the
 * same phrasing for shared ideas (typing, skipping, levels). Plain words, short sentences,
 * and only questions the generators really produce.
 */
export interface Instructions {
  goal: string
  questions: string[]
  answer: string[]
}

const TYPE_IT = 'Type your answer. It moves on as soon as it is right.'
const SKIP = 'Tap Skip to move on.'

export const INSTRUCTIONS: Partial<Record<ModeId, Instructions>> = {
  arithmetic: {
    goal: 'Answer as many questions as you can before time runs out.',
    questions: [
      'Addition, subtraction, multiplication and division.',
      'Powers like 12² and factorials like 5!, if you turn them on.',
      'Harder levels use bigger numbers. On Hard, some answers are negative.',
    ],
    answer: [TYPE_IT, SKIP],
  },
  percent: {
    goal: 'Answer as many questions as you can before time runs out.',
    questions: [
      'Easy: a percentage of a number, like 15% of 240, or a sale price, like $160 with 25% off.',
      'Medium: also two changes in a row, like +20% then −10%.',
      'Hard: also two discounts in a row, and the original price before a change.',
    ],
    answer: [TYPE_IT, 'Answers are whole numbers or have one decimal place.', SKIP],
  },
  fractions: {
    goal: 'Answer as many questions as you can before time runs out.',
    questions: [
      'Turn a fraction into a percentage, like 3/8 = 37.5%.',
      'Harder levels use trickier fractions. On Hard, some are bigger than 1, like 9/8 = 112.5%.',
    ],
    answer: [
      TYPE_IT,
      'For trickier fractions like 2/7, pick from four options instead. Options are rounded, so 1/3 shows as 33.3%.',
      SKIP,
    ],
  },
  rush: {
    goal: 'Hit as many targets as you can before time runs out.',
    questions: [
      'You get four numbers and a target.',
      'Harder levels use bigger targets. On Hard, every target takes at least three steps.',
    ],
    answer: [
      'Tap a number, then +, −, × or ÷, then another number. The two become one new number.',
      'Keep going until you hit the target. You do not have to use every number.',
      'No negative numbers, and division has to come out even.',
      'An exact hit scores 3 points. Finishing close scores 1 or 2.',
      'Undo and Restart are always there. ' + SKIP,
    ],
  },
}
