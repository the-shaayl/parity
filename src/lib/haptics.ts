/*
 * Haptics. Android supports navigator.vibrate. iPhones don't, but on iOS 18 and later toggling
 * a native switch control gives a small tap, so a hidden one is clicked instead. Both fail
 * silently where unsupported. The iPhone tap only works during a tap or key press.
 */

let iosSwitch: HTMLLabelElement | null = null

function iosTick() {
  try {
    if (!iosSwitch) {
      const label = document.createElement('label')
      label.setAttribute('aria-hidden', 'true')
      label.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden'
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.setAttribute('switch', '')
      input.tabIndex = -1
      label.appendChild(input)
      document.body.appendChild(label)
      iosSwitch = label
    }
    iosSwitch.click()
  } catch {
    /* not supported */
  }
}

function vibrate(pattern: number | number[]): boolean {
  try {
    return typeof navigator.vibrate === 'function' && navigator.vibrate(pattern)
  } catch {
    return false
  }
}

/** A light tick on every key press, for a more physical feel. */
export function tap(ms = 10) {
  if (!vibrate(ms)) iosTick()
}
