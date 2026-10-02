export type ModeId = 'arithmetic' | 'percent' | 'fractions' | 'rule72' | 'clock' | 'poker'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Duration = 30 | 60 | 120

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
export const DURATIONS: Duration[] = [30, 60, 120]

/** A random-number source returning a value in [0, 1). Swappable so tests can be repeatable. */
export type Rng = () => number

/** One question, in a shape every mode shares. Plain data only, so it can be saved to storage. */
export interface Question {
  /** Text shown to the player, e.g. "47 × 8". */
  prompt: string
  answer: number
  /** How the player answers: typing on the keypad, or tapping one of `choices`. */
  input: 'type' | 'choice'
  choices?: number[]
  /** Category used for "weak areas" stats, e.g. "multiply". */
  tag: string
  /** Optional worked solution shown when reviewing a miss. */
  explanation?: string
}

export interface GeneratorContext {
  difficulty: Difficulty
  options: Record<string, boolean>
  rng: Rng
  /** The previous question, so generators can avoid immediate repeats. */
  previous?: Question
}

export interface ModeOption {
  id: string
  label: string
  /** Accessible / longer label. */
  title: string
  defaultOn: boolean
}

export interface ModeDef {
  id: ModeId
  name: string
  tagline: string
  description: string
  status: 'ready' | 'soon'
  /** Toggles shown on the setup screen (e.g. which operations to include). */
  options?: ModeOption[]
  /** Formats answers for display, e.g. adding a % or ° sign. */
  unit?: string
  /** Which non-digit keys the keypad needs for this difficulty. */
  keypad?: (difficulty: Difficulty) => { decimal: boolean; negative: boolean }
  generate?: (ctx: GeneratorContext) => Question
}

export interface SprintConfig {
  modeId: ModeId
  difficulty: Difficulty
  duration: Duration
  options: Record<string, boolean>
}

export interface AnswerRecord {
  question: Question
  correct: boolean
  skipped: boolean
  /** Milliseconds spent on this question. */
  ms: number
  /** What the player picked, for multiple-choice misses. */
  given?: number
}

export interface RoundResult {
  config: SprintConfig
  records: AnswerRecord[]
  finishedAt: number
}
