import { DICTIONARY, type LocaleCode } from './i18n.ts';
import messages from '../locales/ui.json' with { type: 'json' };

export const UI_MESSAGES: Record<string, string[]> = messages;
const localeIndex: Partial<Record<LocaleCode, number>> = { 'si-LK': 0, 'ta-LK': 1 };
const existingKeys = new Map(Object.entries(DICTIONARY['en-LK']).map(([key, value]) => [value, key]));
const templates = Object.keys(UI_MESSAGES).filter(source => /\{\d+\}/.test(source)).map(source => ({
  source,
  pattern: new RegExp('^' + source.split(/(\{\d+\})/).map(part => /^\{\d+\}$/.test(part)
    ? '(.+?)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$'),
  names: [...source.matchAll(/\{(\d+)\}/g)].map(match => match[1]),
}));

/** Translate authored interface copy only. User-entered notes and messages never pass through here. */
export function uiText(locale: LocaleCode, source: string, params?: Record<string, string | number>): string {
  if (!params && !UI_MESSAGES[source] && !existingKeys.has(source)) {
    for (const template of templates) {
      const match = source.match(template.pattern);
      if (match) return uiText(locale, template.source, Object.fromEntries(template.names.map((name, i) => [name, match[i + 1]])));
    }
  }
  const key = existingKeys.get(source);
  const index = localeIndex[locale];
  const result = index === undefined ? source : UI_MESSAGES[source]?.[index] ?? (key ? DICTIONARY[locale][key] : source);
  return result.replace(/\{([^}]+)\}/g, (placeholder, name: string) =>
    params && Object.hasOwn(params, name) ? String(params[name]) : placeholder);
}
