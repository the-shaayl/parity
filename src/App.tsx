import { useCallback, useEffect, useState } from 'react'
import type { ModeId, RoundResult, SprintConfig } from './engine/types'
import { Home } from './screens/Home'
import { getMode } from './modes'
import { Play } from './screens/Play'
import { RushPlay } from './screens/RushPlay'
import { Results, type SaveInfo } from './screens/Results'
import { Setup } from './screens/Setup'
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
    setStack((s) => [...s.slice(0, -1), { name: 'results', result, saveInfo }])
  }, [])

  return (
    <main className="safe-area mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      {route.name === 'home' && <Home onSelect={(modeId) => push({ name: 'setup', modeId })} />}

      {route.name === 'setup' && <Setup modeId={route.modeId} onBack={back} onStart={start} />}

      {route.name === 'play' && (
        <div className="flex flex-1 flex-col">
          {getMode(route.config.modeId).kind === 'rush' ? (
            <RushPlay key={route.round} config={route.config} onQuit={back} onFinish={finish} />
          ) : (
            <Play key={route.round} config={route.config} onQuit={back} onFinish={finish} />
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
