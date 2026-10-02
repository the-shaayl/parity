/** A short vibration on supported devices (Android). iOS Safari ignores this silently. */
export function tap(ms = 8) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* not supported */
  }
}
