/**
 * A faint full-screen wash of colour that fades out: green for a right answer, red for a wrong
 * one. `seq` changes on every answer so the same colour can replay back to back.
 */
export function ScreenFlash({ kind, seq }: { kind: 'correct' | 'wrong' | null; seq: number }) {
  if (!kind || seq === 0) return null
  return (
    <div
      key={`${kind}-${seq}`}
      aria-hidden
      className={`flash-fade pointer-events-none fixed inset-0 z-40 ${kind === 'correct' ? 'bg-success/10' : 'bg-danger/15'}`}
    />
  )
}
