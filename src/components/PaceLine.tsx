import type { PaceMessage } from '../lib/pace'

/** The small "2 ahead of best" line under the score. Keeps its height so nothing shifts. */
export function PaceLine({ message }: { message: PaceMessage | null }) {
  return (
    <p className={`mt-2 h-4 text-right text-xs ${message?.tone === 'ahead' ? 'text-accent' : 'text-muted'}`}>
      {message?.text}
    </p>
  )
}
