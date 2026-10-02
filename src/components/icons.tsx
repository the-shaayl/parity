/* Small inline icons, so there's no icon library dependency. */
const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const Icons = {
  back: () => (
    <svg {...iconProps}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  close: () => (
    <svg {...iconProps}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  chevron: () => (
    <svg {...iconProps} width={18} height={18}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  backspace: () => (
    <svg {...iconProps} width={26} height={26}>
      <path d="M21 5H9l-6 7 6 7h12a1 1 0 001-1V6a1 1 0 00-1-1z" />
      <path d="M17 9l-5 6M12 9l5 6" />
    </svg>
  ),
  trophy: () => (
    <svg {...iconProps} width={18} height={18}>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4" />
    </svg>
  ),
}
