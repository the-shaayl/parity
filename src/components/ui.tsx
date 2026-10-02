import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:opacity-90 active:opacity-80',
  secondary: 'border border-border text-fg hover:border-muted active:bg-surface',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex h-12 items-center justify-center rounded-xs px-5 text-base font-semibold transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    />
  )
}

/** A plain text button, e.g. "← back" or "skip". */
export function TextButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`-mx-2 px-2 py-2 text-sm text-muted transition-colors hover:text-fg ${className}`}
    />
  )
}

/**
 * A row of mutually exclusive text options with a label on the left, in the style of a
 * terminal settings line: the selected option is in the accent color.
 */
export function OptionRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex items-baseline gap-4 py-3">
      <span className="w-24 shrink-0 text-sm text-muted">{label}</span>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={`py-1 text-base transition-colors ${
              o.value === value ? 'font-semibold text-accent' : 'text-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
