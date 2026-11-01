/**
 * Native Haptics service with graceful web fallback.
 * Calls Capacitor Haptics plugin on native devices, navigator.vibrate on web, or no-op.
 */

export type HapticFeedbackType = 'selection' | 'success' | 'warning' | 'error';

export async function triggerHaptic(type: HapticFeedbackType): Promise<void> {
  try {
    // 1. Try Capacitor Native Haptics Plugin if available
    const nativeHaptics = typeof window !== 'undefined' ? window.Capacitor?.Plugins?.Haptics : null;

    if (nativeHaptics) {
      switch (type) {
        case 'selection':
          if (typeof nativeHaptics.selectionChanged === 'function') {
            await nativeHaptics.selectionChanged();
            return;
          }
          if (typeof nativeHaptics.impact === 'function') {
            await nativeHaptics.impact({ style: 'LIGHT' });
            return;
          }
          break;
        case 'success':
          if (typeof nativeHaptics.notification === 'function') {
            await nativeHaptics.notification({ type: 'SUCCESS' });
            return;
          }
          break;
        case 'warning':
          if (typeof nativeHaptics.notification === 'function') {
            await nativeHaptics.notification({ type: 'WARNING' });
            return;
          }
          break;
        case 'error':
          if (typeof nativeHaptics.notification === 'function') {
            await nativeHaptics.notification({ type: 'ERROR' });
            return;
          }
          break;
      }
    }

    // 2. Browser navigator.vibrate fallback (supported on Android Chrome/Firefox)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'selection':
          navigator.vibrate(10);
          break;
        case 'success':
          navigator.vibrate([15, 30, 20]);
          break;
        case 'warning':
          navigator.vibrate([30, 40, 30]);
          break;
        case 'error':
          navigator.vibrate([40, 50, 40, 50]);
          break;
      }
    }
  } catch (err) {
    // Haptics are purely tactile enhancements; failures must never interrupt user flow
    console.debug('Haptic feedback skipped:', err);
  }
}
