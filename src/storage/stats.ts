import { summarize } from '../engine/sprint'
import type { Difficulty, Duration, ModeId, RoundResult, SprintConfig } from '../engine/types'

/**
 * Everything the app remembers lives in the browser's localStorage under one key.
 * The `version` field lets future updates migrate old data instead of wiping it.
 */
const KEY = 'parity:data'
const VERSION = 1
const MAX_ROUNDS = 200

export interface SavedRound {
  modeId: ModeId
  difficulty: Difficulty
  duration: Duration
  score: number
  attempted: number
  avgCorrectMs: number | null
  finishedAt: number
}

export interface TagStat {
  attempts: number
  correct: number
  totalCorrectMs: number
}

interface SavedData {
  version: typeof VERSION
  bests: Record<string, number>
  rounds: SavedRound[]
  tags: Record<string, TagStat>
  lastConfig: Partial<Record<ModeId, SprintConfig>>
}

const empty = (): SavedData => ({
  version: VERSION,
  bests: {},
  rounds: [],
  tags: {},
  lastConfig: {},
})

export function load(): SavedData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const data = JSON.parse(raw)
    if (data?.version !== VERSION) return empty()
    return { ...empty(), ...data }
  } catch {
    // Private browsing, blocked storage or corrupted data: run without saved stats.
    return empty()
  }
}

function save(data: SavedData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable; the round still plays, it just isn't remembered.
  }
}

export const bestKey = (c: Pick<SprintConfig, 'modeId' | 'difficulty' | 'duration'>) =>
  `${c.modeId}:${c.difficulty}:${c.duration}`

export function getBest(config: Pick<SprintConfig, 'modeId' | 'difficulty' | 'duration'>): number | null {
  return load().bests[bestKey(config)] ?? null
}

/** Saves a finished round and reports whether it beat the previous best. */
export function recordRound(result: RoundResult): { previousBest: number | null; isNewBest: boolean } {
  const data = load()
  const { config, records } = result
  const summary = summarize(records)
  const key = bestKey(config)
  const previousBest = data.bests[key] ?? null
  const isNewBest = summary.score > 0 && (previousBest === null || summary.score > previousBest)
  if (isNewBest) data.bests[key] = summary.score

  data.rounds = [
    {
      modeId: config.modeId,
      difficulty: config.difficulty,
      duration: config.duration,
      score: summary.score,
      attempted: summary.attempted,
      avgCorrectMs: summary.avgCorrectMs,
      finishedAt: result.finishedAt,
    },
    ...data.rounds,
  ].slice(0, MAX_ROUNDS)

  for (const r of records) {
    const tagKey = `${config.modeId}:${r.question.tag}`
    const t = (data.tags[tagKey] ??= { attempts: 0, correct: 0, totalCorrectMs: 0 })
    t.attempts++
    if (r.correct) {
      t.correct++
      t.totalCorrectMs += r.ms
    }
  }

  save(data)
  return { previousBest, isNewBest }
}

export function getLastConfig(modeId: ModeId): SprintConfig | null {
  return load().lastConfig[modeId] ?? null
}

export function saveLastConfig(config: SprintConfig) {
  const data = load()
  data.lastConfig[config.modeId] = config
  save(data)
}

type ConfigKey = Pick<SprintConfig, 'modeId' | 'difficulty' | 'duration'>

/** The most recent rounds played with exactly these settings, newest first. */
export function getRecentRounds(config: ConfigKey, limit = 10): SavedRound[] {
  return load()
    .rounds.filter(
      (r) => r.modeId === config.modeId && r.difficulty === config.difficulty && r.duration === config.duration,
    )
    .slice(0, limit)
}

/** Personal best for a mode at the settings the player last used (or the defaults). */
export function getModeBest(modeId: ModeId): { score: number; config: ConfigKey } | null {
  const data = load()
  const config = data.lastConfig[modeId] ?? { modeId, difficulty: 'medium' as const, duration: 60 as const }
  const score = data.bests[bestKey(config)]
  return score === undefined ? null : { score, config }
}

/** Whether the player has finished at least one round of this mode, at any settings. */
export function hasPlayed(modeId: ModeId): boolean {
  return load().rounds.some((r) => r.modeId === modeId)
}
