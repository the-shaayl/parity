import type { ModeId } from '../engine/types'

export interface Instructions {
  /** One sentence: what you're trying to do. */
  goal: string
  /** A few short lines on what you'll be asked and how it works. */
  points: string[]
}

/**
 * "How to play" text for each mode. Keep it plain: short sentences, everyday words,
 * and only describe questions the generators really produce.
 */
export const INSTRUCTIONS: Partial<Record<ModeId, Instructions>> = {
  arithmetic: {
    goal: 'Answer as many questions as you can before the time runs out.',
    points: [
      'You get addition, subtraction, multiplication and division.',
      'You can also turn on powers, like 12², and factorials, like 5!.',
      'Harder levels use bigger numbers. On Hard, some subtraction answers are negative.',
      'Type your answer. It moves on by itself as soon as it is right.',
      'Stuck? Tap Skip.',
    ],
  },
  percent: {
    goal: 'Work out percentages fast, the way you would in a case or finance interview.',
    points: [
      'Easy: find a percentage of a number, like 15% of 240, or a sale price, like $160 with 25% off.',
      'Medium: also the total change after two changes in a row, like up 20% then down 10%.',
      'Hard: also the total discount from two discounts, and the original price before a change.',
      'Answers are whole numbers or have one decimal place.',
      'Type your answer. It moves on by itself as soon as it is right.',
    ],
  },
  fractions: {
    goal: 'Turn fractions into percentages.',
    points: [
      'For simple fractions like 3/8, type the answer (37.5).',
      'For harder ones like 2/7, pick from four options.',
      'Options are rounded, so 1/3 shows as 33.3%.',
      'On Hard, some fractions are bigger than 1, like 9/8 = 112.5%.',
    ],
  },
  rush: {
    goal: 'Use the four numbers to hit the target. Solve as many as you can in 2 minutes.',
    points: [
      'Tap a number, then +, −, × or ÷, then another number. The two become one new number.',
      'Keep going until you hit the target. You do not have to use every number.',
      'No negative numbers, and division has to come out even.',
      'Exact hits score 3 points. If you finish close but not exact, you still get 1 or 2.',
      'Undo, Restart and Skip are there whenever you need them.',
    ],
  },
}
