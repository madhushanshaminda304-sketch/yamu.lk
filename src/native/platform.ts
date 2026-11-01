/**
 * Safe detection of native Capacitor environment vs web browser.
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: Record<string, any>;
    };
  }
}

/**
 * Returns true if running inside a native mobile container (Capacitor Android/iOS),
 * false if running in standard desktop or mobile web browser.
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

/**
 * Returns current platform name ('android', 'ios', or 'web').
 */
export function getPlatform(): 'android' | 'ios' | 'web' {
  if (typeof window === 'undefined') {
    return 'web';
  }
  const platform = window.Capacitor?.getPlatform?.();
  if (platform === 'android' || platform === 'ios') {
    return platform;
  }
  return 'web';
}
