import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findNearestHub } from '../src/native/geolocation.ts';
import { ALL_HUBS } from '../src/domain/corridors.ts';
import { isNativePlatform } from '../src/native/platform.ts';
import { triggerHaptic } from '../src/native/haptics.ts';
import { registerBackButtonHandler, pushOverlayDismissHandler, triggerBackActionForTesting } from '../src/native/backButton.ts';
import { setAppStatusBar } from '../src/native/statusBar.ts';

describe('Nearest Sri Lankan Hub Geolocation Matcher', () => {
  it('identifies Makumbura Multimodal Center when GPS is near Kottawa/Maharagama', () => {
    // 6.8400° N, 79.9700° E (Near Kottawa)
    const result = findNearestHub({ latitude: 6.8400, longitude: 79.9700 }, ALL_HUBS);
    assert.equal(result.hub.id, 'makumbura');
    assert.ok(result.distanceKm < 5, `Expected distance < 5km, got ${result.distanceKm}`);
  });

  it('identifies Kandy Clock Tower when GPS is near Peradeniya/Kandy', () => {
    // 7.2910° N, 80.6330° E
    const result = findNearestHub({ latitude: 7.2910, longitude: 80.6330 }, ALL_HUBS);
    assert.equal(result.hub.id, 'kandy');
    assert.ok(result.distanceKm < 3, `Expected distance < 3km, got ${result.distanceKm}`);
  });

  it('identifies Galle hub when GPS is near Galle Fort', () => {
    // 6.0350° N, 80.2170° E (Near Galle Fort)
    const result = findNearestHub({ latitude: 6.0350, longitude: 80.2170 }, ALL_HUBS);
    assert.equal(result.hub.id, 'galle');
    assert.ok(result.distanceKm < 5);
  });
});

describe('Native Platform & Services Fallbacks', () => {
  it('isNativePlatform returns false in Node/test environment', () => {
    assert.equal(isNativePlatform(), false);
  });

  it('triggerHaptic runs safely without error in non-native environment', async () => {
    await assert.doesNotReject(async () => {
      await triggerHaptic('selection');
      await triggerHaptic('success');
      await triggerHaptic('warning');
      await triggerHaptic('error');
    });
  });

  it('registerBackButtonHandler registers and returns unregister cleanup function', () => {
    let closedModal = false;
    let navigated = false;

    const cleanup = registerBackButtonHandler(
      () => { navigated = true; },
      () => false,
      () => { closedModal = true; }
    );

    assert.equal(typeof cleanup, 'function');
    cleanup();
  });

  it('pushOverlayDismissHandler intercepts back action in LIFO order before modal or navigation', () => {
    let navTarget: string | number | null = null;
    let modalClosed = false;

    const cleanupHandler = registerBackButtonHandler(
      (path) => { navTarget = path; },
      () => true, // a base modal is open
      () => { modalClosed = true; }
    );

    const callOrder: string[] = [];

    // Push two overlay handlers (bottom sheet and child dialog)
    const unregisterSheet = pushOverlayDismissHandler(() => {
      callOrder.push('sheet');
      return true; // consumed
    });

    const unregisterDialog = pushOverlayDismissHandler(() => {
      callOrder.push('dialog');
      return true; // consumed
    });

    // 1st back press: should dismiss dialog (LIFO)
    triggerBackActionForTesting();
    assert.deepEqual(callOrder, ['dialog']);
    assert.equal(modalClosed, false, 'Base modal should not have closed');
    assert.equal(navTarget, null, 'Navigation should not have occurred');

    unregisterDialog();

    // 2nd back press: should dismiss sheet
    triggerBackActionForTesting();
    assert.deepEqual(callOrder, ['dialog', 'sheet']);
    assert.equal(modalClosed, false);
    assert.equal(navTarget, null);

    unregisterSheet();

    // 3rd back press: no overlays left in stack -> closes base modal
    triggerBackActionForTesting();
    assert.equal(modalClosed, true, 'Base modal should close now that overlay stack is empty');

    cleanupHandler();
  });

  it('pushOverlayDismissHandler cleanup unregisters cleanly', () => {
    let overlayCalled = false;
    const unregister = pushOverlayDismissHandler(() => {
      overlayCalled = true;
      return true;
    });

    unregister();

    let modalClosed = false;
    const cleanupHandler = registerBackButtonHandler(
      () => {},
      () => true,
      () => { modalClosed = true; }
    );

    triggerBackActionForTesting();
    assert.equal(overlayCalled, false, 'Unregistered overlay handler must not be called');
    assert.equal(modalClosed, true);

    cleanupHandler();
  });

  it('setAppStatusBar resolves cleanly in non-native environment', async () => {
    await assert.doesNotReject(async () => {
      await setAppStatusBar('#047857', false);
    });
  });
});
