import { useSyncExternalStore } from 'react';
import { defaultMarketplaceStore } from '../state/store.ts';
import { uiText } from '../domain/uiText.ts';
import type { LocaleCode } from '../domain/i18n.ts';

export function useUiText(override?: LocaleCode) {
  const state = useSyncExternalStore(defaultMarketplaceStore.subscribe, defaultMarketplaceStore.getState, defaultMarketplaceStore.getState);
  const locale = override ?? state.locale;
  return { uiLocale: locale, tr: (source: string, params?: Record<string, string | number>) => uiText(locale, source, params) };
}
