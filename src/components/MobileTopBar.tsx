import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CaretLeft, UserCheck, SignIn, CheckCircle } from '@phosphor-icons/react';
import { YamoIcon } from './YamoLogo.tsx';
import { triggerHaptic } from '../native/haptics.ts';
import { t, type LocaleCode } from '../domain/i18n.ts';
import { useMarketplaceStore, defaultMarketplaceStore, type MarketplaceStore } from '../state/store.ts';
import type { MarketplaceState } from '../state/types.ts';

export interface MobileTopBarProps {
  state?: MarketplaceState;
  store?: MarketplaceStore;
  openAuthModal?: (onSuccess?: () => void) => void;
  title?: string;
}

function resolveScreenTitle(pathname: string, locale: LocaleCode): { title: string; isRoot: boolean } {
  const path = pathname.toLowerCase();
  if (path === '/' || path === '') {
    return { title: '', isRoot: true };
  }
  if (path.startsWith('/search')) {
    const searchTitle = t(locale, 'nav.search');
    return { title: searchTitle !== 'nav.search' ? searchTitle : 'Search Rides', isRoot: false };
  }
  if (path.startsWith('/publish')) {
    const pubTitle = t(locale, 'nav.publish');
    return { title: pubTitle !== 'nav.publish' ? pubTitle : 'Offer a Ride', isRoot: false };
  }
  if (path === '/rides' || path.startsWith('/your-rides')) {
    const ridesTitle = t(locale, 'nav.rides');
    return { title: ridesTitle !== 'nav.rides' ? ridesTitle : 'Your Rides', isRoot: false };
  }
  if (path.startsWith('/rides/')) {
    return { title: 'Ride Details', isRoot: false };
  }
  if (path.startsWith('/inbox')) {
    const inboxTitle = t(locale, 'nav.inbox');
    return { title: inboxTitle !== 'nav.inbox' ? inboxTitle : 'Inbox', isRoot: false };
  }
  if (path.startsWith('/profile')) {
    const profTitle = t(locale, 'nav.profile');
    return { title: profTitle !== 'nav.profile' ? profTitle : 'Profile & Trust', isRoot: false };
  }
  return { title: 'Yamo', isRoot: false };
}

export function MobileTopBar({
  state: propState,
  store: propStore,
  openAuthModal,
  title: propTitle,
}: MobileTopBarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const locationPath = location.pathname;

  const fallbackStore = propStore?.getState?.() ?? null;
  const storeState = useMarketplaceStore();
  const state = propState ?? fallbackStore ?? storeState;
  const locale = (state?.locale ?? 'en-LK') as LocaleCode;
  const user = state?.currentUser;

  const { title: resolvedTitle, isRoot } = resolveScreenTitle(locationPath, locale);
  const displayTitle = propTitle ?? resolvedTitle;

  const handleBack = () => {
    triggerHaptic('selection');
    navigate(-1);
  };

  const handleLanguageChange = (newLocale: LocaleCode) => {
    triggerHaptic('selection');
    const targetStore = propStore ?? defaultMarketplaceStore;
    if (targetStore?.setLocale) {
      targetStore.setLocale(newLocale);
    }
  };

  return (
    <header
      className="mobile-top-bar md:hidden"
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '54px',
          padding: '0 12px',
          gap: '8px',
        }}
      >
        {/* Left: Brand mark or Back button + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          {isRoot ? (
            <Link
              to="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              aria-label="Yamo Home"
            >
              <YamoIcon size={28} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#064e3b', letterSpacing: '-0.5px' }}>
                  yamo<span style={{ color: '#f59e0b' }}>.lk</span>
                </span>
              </div>
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go Back"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '9999px',
                  background: '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#064e3b',
                  flexShrink: 0,
                }}
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <h1
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#064e3b',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.3px',
                }}
              >
                {displayTitle}
              </h1>
            </div>
          )}
        </div>

        {/* Right: Trilingual Pill & User Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Trilingual Switcher Pill */}
          <div
            className="mobile-lang-pill"
            role="group"
            aria-label="Language Selector"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f5f9',
              borderRadius: '9999px',
              padding: '2px',
              border: '1px solid #e2e8f0',
            }}
          >
            {(['en-LK', 'si-LK', 'ta-LK'] as const).map((code) => {
              const active = locale === code;
              const label = code === 'en-LK' ? 'EN' : code === 'si-LK' ? 'සිං' : 'தமிழ்';
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageChange(code)}
                  style={{
                    padding: '3px 7px',
                    fontSize: '11px',
                    fontWeight: active ? 800 : 600,
                    borderRadius: '9999px',
                    background: active ? '#047857' : 'transparent',
                    color: active ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Profile link or Sign In Trigger */}
          {user ? (
            <Link
              to="/profile"
              onClick={() => triggerHaptic('selection')}
              aria-label="User Profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                background: '#ecfdf5',
                borderRadius: '9999px',
                color: '#047857',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid #a7f3d0',
                maxWidth: '90px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <UserCheck size={14} weight="bold" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name.split(' ')[0]}
              </span>
              {user.verifiedPhone && <CheckCircle size={12} color="#047857" weight="fill" />}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                openAuthModal?.();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                background: '#047857',
                color: '#ffffff',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <SignIn size={14} weight="bold" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
