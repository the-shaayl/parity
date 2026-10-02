import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface text-fg border border-border hover:bg-surface-2 active:bg-surface-2',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className="-m-2 flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
    >
      {children}
    </button>
  )
}

/** A row of mutually exclusive choices, like an iOS segmented control. */
export function Segmented<T extends string | number>({
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
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-muted">{label}</legend>
      <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl bg-surface-2 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={`h-10 rounded-lg text-sm font-semibold transition ${
              o.value === value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface ${className}`}>{children}</div>
}
