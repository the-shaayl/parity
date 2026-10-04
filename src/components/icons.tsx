/* Small inline icons, so there's no icon library dependency. */
const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
  'aria-hidden': true,
}

export const Icons = {
  close: () => (
    <svg {...iconProps}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  backspace: () => (
    <svg {...iconProps} width={24} height={24}>
      <path d="M21 5H9l-6 7 6 7h12V5z" />
      <path d="M17 9l-5 6M12 9l5 6" />
    </svg>
  ),
  share: () => (
    <svg {...iconProps} width={16} height={16}>
      <path d="M12 3v12M7 8l5-5 5 5" />
      <path d="M5 12v8h14v-8" />
    </svg>
  ),
}
