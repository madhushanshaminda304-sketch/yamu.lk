/**
 * Native Hardware Back Button Handler for Android with web fallback.
 * Prioritizes:
 * 1. Closing active modals / bottom sheets.
 * 2. Navigating back in history if on a sub-route.
 * 3. Double-tap to exit on root view to prevent accidental app termination.
 */

export interface BackButtonOptions {
  navigate: (path: string | -1) => void;
  isModalOpen: () => boolean;
  closeModal: () => void;
  onRootExitPrompt?: () => void;
}

let lastRootBackPress = 0;
const overlayStack: Array<() => boolean> = [];

/**
 * Register a temporary overlay/sheet dismiss callback with the back button stack.
 * Return true if the back press was consumed by closing the overlay.
 */
export function pushOverlayDismissHandler(dismiss: () => boolean): () => void {
  overlayStack.push(dismiss);
  return () => {
    const idx = overlayStack.indexOf(dismiss);
    if (idx !== -1) {
      overlayStack.splice(idx, 1);
    }
  };
}

let activeBackActionForTesting: ((canGoBackFromNative?: boolean) => void) | null = null;

export function triggerBackActionForTesting(canGoBackFromNative?: boolean): void {
  activeBackActionForTesting?.(canGoBackFromNative);
}

export function registerBackButtonHandler(
  navigate: (path: string | -1) => void,
  isModalOpen: () => boolean,
  closeModal: () => void,
  onRootExitPrompt?: () => void
): () => void {
  let isCleanedUp = false;
  let nativeListenerHandle: { remove: () => void } | null = null;

  const handleBackAction = (canGoBackFromNative?: boolean) => {
    // 0. If any registered overlay in the stack consumes the back press, stop here
    for (let i = overlayStack.length - 1; i >= 0; i--) {
      if (overlayStack[i]()) {
        return;
      }
    }

    // 1. If a modal or sheet is open, dismiss it first
    if (isModalOpen()) {
      closeModal();
      return;
    }

    // 2. Check if currently at root route ('/' or empty)
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const isAtRoot = currentPath === '/' || currentPath === '';

    if (!isAtRoot) {
      // Navigate back to previous screen
      navigate(-1);
      return;
    }

    // 3. At root route: protect against accidental app exit
    const now = Date.now();
    if (now - lastRootBackPress < 2000) {
      // Second press within 2 seconds: exit native app if available
      const nativeApp = typeof window !== 'undefined' ? window.Capacitor?.Plugins?.App : null;
      if (nativeApp?.exitApp) {
        nativeApp.exitApp();
      }
    } else {
      lastRootBackPress = now;
      if (onRootExitPrompt) {
        onRootExitPrompt();
      }
    }
  };

  activeBackActionForTesting = handleBackAction;

  // Register Capacitor native backButton listener if available
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.App?.addListener) {
    try {
      const listenerPromise = window.Capacitor.Plugins.App.addListener(
        'backButton',
        (eventData: { canGoBack?: boolean }) => {
          handleBackAction(eventData?.canGoBack);
        }
      );

      // Handle async promise returned by addListener
      if (listenerPromise && typeof listenerPromise.then === 'function') {
        listenerPromise
          .then((handle: any) => {
            if (isCleanedUp) {
              handle?.remove?.();
            } else {
              nativeListenerHandle = handle;
            }
          })
          .catch((err: unknown) => {
            console.warn('Failed to register native backButton handle:', err);
          });
      }
    } catch (err) {
      console.warn('Could not register native backButton listener:', err);
    }
  }

  // Register browser popstate listener for web environments
  const handlePopState = (event: PopStateEvent) => {
    if (isModalOpen()) {
      event.preventDefault();
      closeModal();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', handlePopState);
  }

  // Return unregister/cleanup function
  return () => {
    isCleanedUp = true;
    activeBackActionForTesting = null;
    if (nativeListenerHandle?.remove) {
      nativeListenerHandle.remove();
      nativeListenerHandle = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', handlePopState);
    }
  };
}
