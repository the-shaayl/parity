import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const COUNTDOWN_FROM = 3
/** Pause between the clock reaching 0 and the results, so the "time's up" shake can be seen. */
const TIME_UP_PAUSE_MS = 600

/**
 * The 3-2-1 countdown and the round clock, shared by every timed mode.
 * `onStart` runs when play begins; `onEnd` runs exactly once when time is up.
 */
export function useRoundClock(
  durationSeconds: number,
  onStart: (now: number) => void,
  onEnd: () => void,
  onTimeUp?: () => void,
) {
  const [phase, setPhase] = useState<'countdown' | 'playing'>('countdown')
  const [count, setCount] = useState(COUNTDOWN_FROM)
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const [timeUp, setTimeUp] = useState(false)

  // Timers fire later than they're created, so they read the latest callbacks through refs.
  const onStartRef = useRef(onStart)
  const onEndRef = useRef(onEnd)
  const onTimeUpRef = useRef(onTimeUp)
  useLayoutEffect(() => {
    onStartRef.current = onStart
    onEndRef.current = onEnd
    onTimeUpRef.current = onTimeUp
  })
  const ended = useRef(false)

  useEffect(() => {
    if (phase !== 'countdown') return
    const t = setTimeout(() => {
      if (count > 1) {
        setCount(count - 1)
      } else {
        onStartRef.current(performance.now())
        setPhase('playing')
      }
    }, 700)
    return () => clearTimeout(t)
  }, [phase, count])

  // Measured against a fixed end time so it stays accurate even if the browser delays
  // timers (e.g. when the app is briefly in the background).
  useEffect(() => {
    // A duration of 0 means the mode has no round clock (it ends some other way).
    if (phase !== 'playing' || durationSeconds <= 0) return
    const endAt = performance.now() + durationSeconds * 1000
    const interval = setInterval(() => {
      const left = endAt - performance.now()
      setSecondsLeft(Math.max(0, Math.ceil(left / 1000)))
      if (left <= 0 && !ended.current) {
        ended.current = true
        clearInterval(interval)
        setTimeUp(true)
        onTimeUpRef.current?.()
        setTimeout(() => onEndRef.current(), TIME_UP_PAUSE_MS)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [phase, durationSeconds])

  // `playing` turns off the moment time is up, so no answers count during the shake.
  return { phase, count, secondsLeft, timeUp, playing: phase === 'playing' && !timeUp }
}
