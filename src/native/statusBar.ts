/**
 * Native Status Bar management with web fallback.
 * Configures the mobile status bar background color and icon theme.
 */

export async function setAppStatusBar(colorHex: string, isDark: boolean): Promise<void> {
  try {
    // 1. Native Capacitor StatusBar plugin if available
    const nativeStatusBar =
      typeof window !== 'undefined' ? window.Capacitor?.Plugins?.StatusBar : null;

    if (nativeStatusBar) {
      if (typeof nativeStatusBar.setBackgroundColor === 'function') {
        await nativeStatusBar.setBackgroundColor({ color: colorHex });
      }
      if (typeof nativeStatusBar.setStyle === 'function') {
        // 'DARK' means dark text/icons (for light backgrounds); 'LIGHT' means light text/icons (for dark backgrounds)
        await nativeStatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
      }
    }

    // 2. Web browser meta theme-color fallback
    if (typeof document !== 'undefined') {
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', colorHex);
    }
  } catch (err) {
    console.debug('StatusBar styling skipped:', err);
  }
}
