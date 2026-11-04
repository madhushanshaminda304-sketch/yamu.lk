import { getHubById, getHubDisplayName } from './corridors.ts';
import { formatColomboDate, formatLkr, type LocaleCode } from './i18n.ts';
import { uiText } from './uiText.ts';
import type { AppNotification } from '../state/types.ts';

export function localizeNotification(notification: AppNotification, locale: LocaleCode): AppNotification {
  if (!notification.copy) return notification;
  const values = { ...notification.copy.values };
  if (notification.copy.fromHubId) values['0'] = getHubDisplayName(getHubById(notification.copy.fromHubId), locale) || notification.copy.fromHubId;
  if (notification.copy.toHubId) values['1'] = getHubDisplayName(getHubById(notification.copy.toHubId), locale) || notification.copy.toHubId;
  const bodyValues = { ...notification.copy.bodyValues };
  if (notification.copy.date) bodyValues['1'] = formatColomboDate(`${notification.copy.date}T12:00:00+05:30`, locale);
  if (notification.copy.amount !== undefined) bodyValues['2'] = formatLkr(notification.copy.amount, locale);
  if (notification.copy.settlement) bodyValues['3'] = uiText(locale, notification.copy.settlement);
  if (notification.copy.statusTitle) values['0'] = uiText(locale, notification.copy.statusTitle);
  if (notification.copy.journeyStatus) bodyValues['1'] = uiText(locale, notification.copy.journeyStatus);
  return { ...notification, title: uiText(locale, notification.copy.title, values), body: uiText(locale, notification.copy.body, bodyValues) };
}
