import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceStore } from '../src/state/store.ts';

test('store manages trusted contacts and saved commute places', () => {
  const store = createMarketplaceStore();
  const initialContactsCount = store.getState().currentUser?.trustedContacts?.length ?? 0;
  const initialPlacesCount = store.getState().currentUser?.savedPlaces?.length ?? 0;

  store.addTrustedContact({ id: 'tc-test-1', name: 'Amma', phone: '+94712345678', relationship: 'Mother' });
  assert.equal(store.getState().currentUser?.trustedContacts?.length, initialContactsCount + 1);
  assert.ok(store.getState().currentUser?.trustedContacts?.some((c) => c.id === 'tc-test-1' && c.name === 'Amma'));

  store.saveFavoritePlace({ id: 'sp-test-1', label: 'work', title: 'Work', hubId: 'makumbura', landmark: 'MMC Gate' });
  assert.equal(store.getState().currentUser?.savedPlaces?.length, initialPlacesCount + 1);
  assert.ok(store.getState().currentUser?.savedPlaces?.some((p) => p.id === 'sp-test-1' && p.hubId === 'makumbura'));

  store.removeTrustedContact('tc-test-1');
  assert.equal(store.getState().currentUser?.trustedContacts?.length, initialContactsCount);

  store.removeFavoritePlace('sp-test-1');
  assert.equal(store.getState().currentUser?.savedPlaces?.length, initialPlacesCount);
});
