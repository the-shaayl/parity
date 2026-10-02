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
    answer: [TYPE_IT],
  },
  percent: {
    goal: 'Answer as many questions as you can before time runs out.',
    answer: [TYPE_IT, 'Answers are whole numbers or have one decimal place.'],
  },
  fractions: {
    goal: 'Answer as many questions as you can before time runs out.',
    answer: [
      'Turn each fraction into a percentage, like 3/8 = 37.5.',
      TYPE_IT,
      'Trickier fractions give you four options instead. Options are rounded, so 1/3 shows as 33.3%.',
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
}
