export type ModeId = 'arithmetic' | 'percent' | 'rush' | 'audit' | 'clock'
export type Difficulty = 'easy' | 'medium' | 'hard'
/** Round length in seconds. 0 means there's no round clock (Audit ends on the first mistake). */
export type Duration = 0 | 30 | 60 | 90 | 120

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
export const DURATIONS: Duration[] = [30, 60, 120]

/** A random-number source returning a value in [0, 1). Swappable so tests can be repeatable. */
export type Rng = () => number

/** One question, in a shape every mode shares. Plain data only, so it can be saved to storage. */
export interface Question {
  /** Text shown to the player, e.g. "47 × 8". */
  prompt: string
  /** Short line above the prompt saying what to find, e.g. "Sale price". */
  label?: string
  /** Shown before / after the answer, e.g. "$" and "%". Falls back to the mode's unit. */
  prefix?: string
  unit?: string
  answer: number
  /** How the player answers: typing on the keypad, or tapping one of `choices`. */
  input: 'type' | 'choice'
  choices?: number[]
  /** Category used for "weak areas" stats, e.g. "multiply". */
  tag: string
  /** Optional worked solution shown when reviewing a miss. */
  explanation?: string
  /** For Clock: the time to draw on the clock face. */
  time?: { hour: number; minute: number }
}

export interface GeneratorContext {
  difficulty: Difficulty
  options: Record<string, boolean>
  rng: Rng
  /** The previous question, so generators can avoid immediate repeats. */
  previous?: Question
  /** Milliseconds since a question with each tag was last on screen this round. */
  sinceShown?: Record<string, number>
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
  status: 'ready' | 'soon'
  /** 'rush' modes have their own play screen instead of the question-and-answer one. */
  kind?: 'sprint' | 'rush' | 'audit'
  /** When set, the round length is fixed and the setup screen doesn't offer a choice. */
  fixedDuration?: Duration
  /** Round lengths offered on the setup screen, if not the usual 30/60/120s. */
  durations?: Duration[]
  /** Levels offered on the setup screen, if not all three. */
  levels?: Difficulty[]
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
  /** What the player picked, for multiple-choice misses (or their final number in Rush). */
  given?: number
  /** Points earned, for modes that award partial credit (Rush). Otherwise correct = 1 point. */
  points?: number
}

export interface RoundResult {
  config: SprintConfig
  records: AnswerRecord[]
  finishedAt: number
}
