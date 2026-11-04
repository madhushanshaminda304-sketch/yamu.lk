import { getValidLocale, LOCALE_META, SUPPORTED_LOCALES, type LocaleCode } from './i18n.ts';

export function localeFromPath(pathname: string): LocaleCode | null {
  const segment = pathname.split('/')[1];
  return SUPPORTED_LOCALES.find((locale) => LOCALE_META[locale].langCode === segment) ?? null;
}

export function stripLanguagePrefix(pathname: string): string {
  // Retired Russian links retain their destination when redirected to a supported language.
  return localeFromPath(pathname) || /^\/ru(?:\/|$)/.test(pathname) ? pathname.replace(/^\/[^/]+/, '') || '/' : pathname;
}

/** Localize internal absolute paths, leaving relative and external destinations alone. */
export function localizedPath(path: string, locale: LocaleCode): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const separator = path.search(/[?#]/);
  const pathname = separator < 0 ? path : path.slice(0, separator);
  const suffix = separator < 0 ? '' : path.slice(separator);
  return `/${LOCALE_META[locale].langCode}${stripLanguagePrefix(pathname)}${suffix}`;
}

export function preferredLocale(saved: string | null, languages: readonly string[] = []): LocaleCode {
  if (saved) return getValidLocale(saved);
  for (const language of languages) {
    const code = language.toLowerCase().split('-')[0];
    const locale = SUPPORTED_LOCALES.find((candidate) => LOCALE_META[candidate].langCode === code);
    if (locale) return locale;
  }
  return 'en-LK';
}
