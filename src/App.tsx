import { useCallback, useEffect, useState } from 'react'
import type { ModeId, RoundResult, SprintConfig } from './engine/types'
import { Home } from './screens/Home'
import { getMode } from './modes'
import { Play } from './screens/Play'
import { RushPlay } from './screens/RushPlay'
import { AuditPlay } from './screens/AuditPlay'
import { Results, type SaveInfo } from './screens/Results'
import { Setup } from './screens/Setup'
import { summarize } from './engine/sprint'
import { track } from './lib/analytics'
import { recordRound, saveLastConfig } from './storage/stats'

type Route =
  | { name: 'home' }
  | { name: 'setup'; modeId: ModeId }
  | { name: 'play'; config: SprintConfig; round: number }
  | { name: 'results'; result: RoundResult; saveInfo: SaveInfo }

/**
 * Screens are kept as a simple stack. Each screen we move "into" also adds a browser history
 * entry, so the phone's back gesture/button goes back a screen instead of closing the app.
 */
export default function App() {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }])
  const route = stack[stack.length - 1]

  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  const push = (next: Route) => {
    window.history.pushState(null, '')
    setStack((s) => [...s, next])
  }
  /** Swap the current screen without adding a history entry (e.g. Play → Results). */
  const replace = (next: Route) => setStack((s) => [...s.slice(0, -1), next])
  const back = () => window.history.back()

  const start = (config: SprintConfig) => {
    saveLastConfig(config)
    push({ name: 'play', config, round: Date.now() })
  }

  const finish = useCallback((result: RoundResult) => {
    const saveInfo = recordRound(result)
    const summary = summarize(result.records)
    track('round_finished', {
      ...roundProps(result.config),
      score: summary.score,
      attempted: summary.attempted,
      new_best: saveInfo.isNewBest,
    })
    setStack((s) => [...s.slice(0, -1), { name: 'results', result, saveInfo }])
  }, [])

  // Count every round that starts, including Play again from the results screen.
  const playingRound = route.name === 'play' ? route.round : null
  const playingConfig = route.name === 'play' ? route.config : null
  useEffect(() => {
    if (playingRound !== null && playingConfig) track('round_started', roundProps(playingConfig))
  }, [playingRound, playingConfig])

  const quitRound = () => {
    if (route.name === 'play') track('round_quit', roundProps(route.config))
    back()
  }

  return (
    <main className="safe-area mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      {route.name === 'home' && <Home onSelect={(modeId) => push({ name: 'setup', modeId })} />}

      {route.name === 'setup' && <Setup modeId={route.modeId} onBack={back} onStart={start} />}

      {route.name === 'play' && (
        <div className="flex flex-1 flex-col">
          {getMode(route.config.modeId).kind === 'rush' ? (
            <RushPlay key={route.round} config={route.config} onQuit={quitRound} onFinish={finish} />
          ) : getMode(route.config.modeId).kind === 'audit' ? (
            <AuditPlay key={route.round} config={route.config} onQuit={quitRound} onFinish={finish} />
          ) : (
            <Play key={route.round} config={route.config} onQuit={quitRound} onFinish={finish} />
          )}
        </div>
      )}

      {route.name === 'results' && (
        <Results
          result={route.result}
          saveInfo={route.saveInfo}
          onPlayAgain={() => replace({ name: 'play', config: route.result.config, round: Date.now() })}
          onSettings={back}
          onHome={() => {
            window.history.go(-(stack.length - 1))
            setStack([{ name: 'home' }])
          }}
        />
      )}
    </main>
  )
}

/** The details sent with every round event: which mode, level and length. */
function roundProps(config: SprintConfig) {
  return { mode: getMode(config.modeId).name, level: config.difficulty, duration: config.duration }
}
