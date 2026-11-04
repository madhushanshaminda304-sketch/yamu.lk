import enData from '../locales/en.json' with { type: 'json' };
import siData from '../locales/si.json' with { type: 'json' };
import taData from '../locales/ta.json' with { type: 'json' };
import ruData from '../locales/ru.json' with { type: 'json' };

export type LocaleCode = 'en-LK' | 'si-LK' | 'ta-LK' | 'ru-RU';

export interface LocaleMetadata {
  code: LocaleCode;
  label: string;
  fullLabel: string;
  flag: string;
  langCode: string;
}

export const SUPPORTED_LOCALES: LocaleCode[] = ['en-LK', 'si-LK', 'ta-LK', 'ru-RU'];

export const LOCALE_META: Record<LocaleCode, LocaleMetadata> = {
  'en-LK': { code: 'en-LK', label: 'EN', fullLabel: 'English', flag: '🇬🇧', langCode: 'en' },
  'si-LK': { code: 'si-LK', label: 'සිං', fullLabel: 'සිංහල', flag: '🇱🇰', langCode: 'si' },
  'ta-LK': { code: 'ta-LK', label: 'தமிழ்', fullLabel: 'தமிழ்', flag: '🇱🇰', langCode: 'ta' },
  'ru-RU': { code: 'ru-RU', label: 'РУС', fullLabel: 'Русский', flag: '🇷🇺', langCode: 'ru' },
};

export const DICTIONARY: Record<LocaleCode, Record<string, string>> = {
  'en-LK': enData,
  'si-LK': siData,
  'ta-LK': taData,
  'ru-RU': ruData,
};

export function isValidLocale(code: unknown): code is LocaleCode {
  return typeof code === 'string' && SUPPORTED_LOCALES.includes(code as LocaleCode);
}

export function getValidLocale(raw: string | null | undefined): LocaleCode {
  if (raw && isValidLocale(raw)) return raw;
  if (raw === 'en') return 'en-LK';
  if (raw === 'si') return 'si-LK';
  if (raw === 'ta') return 'ta-LK';
  if (raw === 'ru') return 'ru-RU';
  return 'en-LK';
}

export function t(
  locale: LocaleCode,
  key: string,
  params?: Record<string, string | number>
): string {
  let text = DICTIONARY[locale]?.[key] ?? DICTIONARY['en-LK']?.[key] ?? key;
  if (params && typeof text === 'string') {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, () => String(v));
    }
  }
  return text;
}

export function formatLkr(amount: number): string {
  return 'LKR ' + Math.round(amount).toLocaleString('en-US');
}

export function formatColomboTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Colombo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '';
  }
}

export function formatColomboDate(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Colombo',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return '';
  }
}

export function getColomboDateOffset(daysOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
