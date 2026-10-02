import { useEffect, useState, type ReactNode } from 'react'
import type { ModeId } from '../engine/types'
import type { Instructions } from '../modes/instructions'
import { isHowToPlayHidden, setHowToPlayHidden } from '../storage/howToPlay'
import { Icons } from './icons'
import { Button } from './ui'

/** Full-screen "How to play" page, shown over the setup screen. The same for every mode. */
export function HowToPlay({
  modeId,
  modeName,
  instructions,
  onClose,
}: {
  modeId: ModeId
  modeName: string
  instructions: Instructions
  onClose: () => void
}) {
  // Starts ticked if the player already turned it off, so they can untick it to bring it back.
  const [dontShow, setDontShow] = useState(() => isHowToPlayHidden(modeId))

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

  // Only "Got it" saves the checkbox. Closing with X or Esc leaves the setting as it was.
  const confirm = () => {
    setHowToPlayHidden(modeId, dontShow)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      className="anim-question safe-area fixed inset-0 z-50 overflow-y-auto bg-bg"
    >
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{modeName}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 p-2 text-muted transition-colors hover:text-fg"
          >
            <Icons.close />
          </button>
        </div>

        {/* Centred in the space below the header, so the button sits close to the text. */}
        <div className="my-auto py-8">
          <h1 id="how-to-play-title" className="text-center text-4xl font-bold tracking-tight">
            How to play
          </h1>

          <div className="mt-10 flex flex-col gap-8">
            <Section title="Goal">
              <p>{instructions.goal}</p>
            </Section>

            <Section title="How to answer">
              <ul className="flex flex-col gap-3">
                {instructions.answer.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Section>
          </div>

          <div className="mt-10">
            <Button className="w-full" onClick={confirm}>
              Got it
            </Button>
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="size-4 cursor-pointer accent-accent"
              />
              Do not show again
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="leading-relaxed">
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}
