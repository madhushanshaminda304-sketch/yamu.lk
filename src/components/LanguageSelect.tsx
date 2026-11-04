import React from 'react';
import { LOCALE_META, SUPPORTED_LOCALES, type LocaleCode } from '../domain/i18n.ts';
import { useLanguageChange } from './LocalizedRouter.tsx';
import { useUiText } from './useUiText.ts';

export function LanguageSelect() {
  const { tr, uiLocale } = useUiText();
  const changeLanguage = useLanguageChange();
  return <label style={{ display: 'block', marginBottom: '16px', paddingRight: '32px', fontSize: '14px' }}>
    <span style={{ display: 'block', marginBottom: '4px' }}>{tr('Language Selector')}</span>
    <select aria-label={tr('Language Selector')} value={uiLocale} onChange={event => changeLanguage(event.target.value as LocaleCode)}>
      {SUPPORTED_LOCALES.map(locale => <option key={locale} value={locale} lang={LOCALE_META[locale].langCode}>{LOCALE_META[locale].fullLabel}</option>)}
    </select>
  </label>;
}
