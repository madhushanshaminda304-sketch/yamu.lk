import React from 'react';
import { CaretLeft, UserCheck, SignIn } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate, useLanguageChange } from './LocalizedRouter.tsx';
import { YamoIcon } from './YamoLogo.tsx';
import { LOCALE_META, SUPPORTED_LOCALES, t, type LocaleCode } from '../domain/i18n.ts';
import { triggerHaptic } from '../native/haptics.ts';
import { useMarketplaceStore, type MarketplaceStore } from '../state/store.ts';
import type { MarketplaceState } from '../state/types.ts';
import { useUiText } from './useUiText.ts';

export interface MobileTopBarProps {
  state?: MarketplaceState;
  store?: MarketplaceStore;
  openAuthModal?: (onSuccess?: () => void) => void;
  title?: string;
}

function screenTitle(path: string): string {
  if (path.startsWith('/search')) return 'screen.search.title';
  if (path.startsWith('/publish')) return 'screen.publish.title';
  if (path.startsWith('/rides/')) return 'screen.ride.title';
  if (path === '/rides' || path.startsWith('/your-rides')) return 'screen.rides.title';
  if (path.startsWith('/inbox')) return 'screen.inbox.title';
  if (path.startsWith('/profile')) return 'screen.profile.title';
  return 'brand.name';
}

export function MobileTopBar({ state: propState, store: propStore, openAuthModal, title }: MobileTopBarProps = {}) {
  const fallback = useMarketplaceStore();
  const state = propState ?? propStore?.getState() ?? fallback;
  const locale = state.locale;
  const { tr } = useUiText(locale);
  const location = useLocation();
  const navigate = useNavigate();
  const changeLanguage = useLanguageChange();
  const isRoot = location.pathname === '/';
  const user = state.currentUser;
  return <header className="mobile-top-bar md:hidden">
    <div className="mobile-toolbar">
      <div className="mobile-toolbar-brand">
        {!isRoot && <button className="mobile-back-button" type="button" aria-label={tr('Go Back')}
          onClick={() => { triggerHaptic('selection'); navigate(-1); }}><CaretLeft size={20} weight="bold" /></button>}
        <Link className="mobile-brand-link" to="/" aria-label={tr('Yamo Home')}><YamoIcon size={28} /><span>Yamo</span></Link>
      </div>
      <div className="mobile-toolbar-actions">
        <select className="language-menu" aria-label={tr('Language Selector')} value={locale}
          onChange={event => {
            triggerHaptic('selection');
            const next = event.target.value as LocaleCode;
            propStore?.setLocale(next);
            changeLanguage(next);
          }}>
          {SUPPORTED_LOCALES.map(code => <option key={code} value={code} lang={LOCALE_META[code].langCode}>{LOCALE_META[code].fullLabel}</option>)}
        </select>
        {user ? <Link to="/profile" className="mobile-account-button" aria-label={tr('User Profile')} title={user.name}>
          <UserCheck size={20} weight="bold" />
        </Link> : <button type="button" className="mobile-account-button" aria-label={tr('Sign In')}
          onClick={() => openAuthModal?.()}><SignIn size={20} weight="bold" /></button>}
      </div>
    </div>
    {!isRoot && <div className="mobile-page-title"><h1>{title ?? t(locale, screenTitle(location.pathname))}</h1></div>}
  </header>;
}
