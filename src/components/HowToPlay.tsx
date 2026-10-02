import { useEffect, type ReactNode } from 'react'
import type { Instructions } from '../modes/instructions'
import { Button, TextButton } from './ui'

/** Full-screen "How to play" page, shown over the setup screen. */
export function HowToPlay({
  modeName,
  instructions,
  onClose,
}: {
  modeName: string
  instructions: Instructions
  onClose: () => void
}) {
  // Esc closes it on a laptop; the page behind shouldn't scroll while it's open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      className="anim-question safe-area fixed inset-0 z-50 overflow-y-auto bg-bg"
    >
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">{modeName}</span>
          <TextButton onClick={onClose}>Close</TextButton>
        </div>

        <h1 id="how-to-play-title" className="pt-8 text-4xl font-bold tracking-tight">
          How to play
        </h1>

        <div className="mt-10 flex flex-col gap-8">
          <Section title="Goal">
            <p className="font-semibold">{instructions.goal}</p>
          </Section>

          <Section title="How to answer">
            <ul className="flex flex-col gap-3">
              {instructions.answer.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="mt-auto pt-10">
          <Button className="w-full" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>
      {children}
    </section>
  )
}
