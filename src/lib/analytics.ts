import type { PostHog } from 'posthog-js'

/*
 * Anonymous usage analytics (PostHog). Only runs where VITE_POSTHOG_KEY is set, which is the
 * live site on Vercel, so local development never sends anything.
 *
 * Privacy: no cookies, no personal data, no session recording, no automatic click capture.
 * Each device gets a random ID kept in localStorage so returning visits can be counted.
 * Browsers with Do Not Track switched on are not tracked.
 */

type Props = Record<string, string | number | boolean>

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'
const INSTALLED_FLAG = 'parity:installedTracked'

let client: PostHog | null = null
const queued: [string, Props?][] = []

/** True when Parity was opened from the home screen rather than a browser tab. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function track(event: string, props?: Props) {
  if (!KEY) return
  if (client) client.capture(event, props)
  else queued.push([event, props])
}

/** Loads PostHog after the app has rendered, so it never slows down opening Parity. */
export async function initAnalytics() {
  if (!KEY) return
  const { default: posthog } = await import('posthog-js')
  posthog.init(KEY, {
    api_host: HOST,
    persistence: 'localStorage',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    respect_dnt: true,
  })
  client = posthog
  for (const [event, props] of queued.splice(0)) client.capture(event, props)

  const standalone = isStandalone()
  track('app_opened', { from_home_screen: standalone })

  // There's no install count for a web app, so the first launch from the home screen stands in.
  try {
    if (standalone && !localStorage.getItem(INSTALLED_FLAG)) {
      track('app_installed')
      localStorage.setItem(INSTALLED_FLAG, '1')
    }
  } catch {
    /* storage unavailable */
  }
}
