import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  PlusCircle,
  Car,
  ChatCircleDots,
  UserCircle,
} from '@phosphor-icons/react';
import { triggerHaptic } from '../native/haptics.ts';
import { t, type LocaleCode } from '../domain/i18n.ts';
import { computeUnreadMessagesCount } from '../domain/inbox.ts';
import { useMarketplaceStore, type MarketplaceStore } from '../state/store.ts';
import type { MarketplaceState } from '../state/types.ts';
import { computeMobileBadges, isTabActive, type MobileBadgeCounts } from './mobileNav.ts';

export { computeMobileBadges, isTabActive, type MobileBadgeCounts };

export interface MobileTabDefinition {
  id: 'search' | 'publish' | 'rides' | 'inbox' | 'profile';
  labelKey: string;
  defaultLabel: string;
  path: string;
  matchPaths: string[];
  icon: typeof MagnifyingGlass;
}

export const MOBILE_NAV_TABS: MobileTabDefinition[] = [
  {
    id: 'search',
    labelKey: 'nav.search',
    defaultLabel: 'Search',
    path: '/search',
    matchPaths: ['/', '/search'],
    icon: MagnifyingGlass,
  },
  {
    id: 'publish',
    labelKey: 'nav.publish',
    defaultLabel: 'Publish',
    path: '/publish',
    matchPaths: ['/publish'],
    icon: PlusCircle,
  },
  {
    id: 'rides',
    labelKey: 'nav.rides',
    defaultLabel: 'Your Rides',
    path: '/your-rides',
    matchPaths: ['/your-rides', '/rides'],
    icon: Car,
  },
  {
    id: 'inbox',
    labelKey: 'nav.inbox',
    defaultLabel: 'Inbox',
    path: '/inbox',
    matchPaths: ['/inbox'],
    icon: ChatCircleDots,
  },
  {
    id: 'profile',
    labelKey: 'nav.profile',
    defaultLabel: 'Profile',
    path: '/profile',
    matchPaths: ['/profile'],
    icon: UserCircle,
  },
];

export interface MobileBottomNavProps {
  state?: MarketplaceState;
  store?: MarketplaceStore;
  currentPath?: string;
  onTabChange?: (path: string) => void;
}

export function MobileBottomNav({
  state: propState,
  store: propStore,
  currentPath: propCurrentPath,
  onTabChange,
}: MobileBottomNavProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = propCurrentPath ?? location.pathname;

  // Use props state if provided, otherwise sync with global store
  const fallbackStore = propStore?.getState?.() ?? null;
  const storeState = useMarketplaceStore();
  const state = propState ?? fallbackStore ?? storeState;

  const locale = (state?.locale ?? 'en-LK') as LocaleCode;
  const currentUserName = state?.currentUser?.name ?? '';
  const currentUserId = state?.currentUser?.id ?? '';

  // Calculate unread message count using computeUnreadMessagesCount (0 for unauthenticated guests)
  const unreadMessagesCount =
    currentUserId || currentUserName
      ? computeUnreadMessagesCount(
          state?.messages ?? [],
          state?.lastReadAtByBooking ?? {},
          currentUserId,
          currentUserName
        )
      : 0;

  const badges = computeMobileBadges(
    state?.rides ?? [],
    currentUserName,
    unreadMessagesCount,
    state?.bookings ?? []
  );

  const handleTabPress = (path: string) => {
    triggerHaptic('selection');
    if (onTabChange) {
      onTabChange(path);
    } else {
      navigate(path);
    }
  };

  return (
    <nav
      className="mobile-bottom-nav md:hidden"
      role="navigation"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '56px',
          maxWidth: '560px',
          margin: '0 auto',
          padding: '0 8px',
        }}
      >
        {MOBILE_NAV_TABS.map((tab) => {
          const active = isTabActive(activePath, tab.matchPaths);
          const IconComponent = tab.icon;
          const label = t(locale, tab.labelKey) !== tab.labelKey ? t(locale, tab.labelKey) : tab.defaultLabel;

          let badgeCount = 0;
          if (tab.id === 'rides') {
            badgeCount = badges.yourRidesPendingCount;
          } else if (tab.id === 'inbox') {
            badgeCount = badges.inboxUnreadCount;
          }

          return (
            <button
              key={tab.id}
              type="button"
              className={`mobile-nav-item ${active ? 'active' : ''}`}
              onClick={() => handleTabPress(tab.path)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minHeight: '48px',
                padding: '4px 2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: active ? '#047857' : '#64748b',
                position: 'relative',
                transition: 'color 0.15s ease, transform 0.1s ease',
              }}
            >
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <IconComponent
                  size={24}
                  weight={active ? 'fill' : 'regular'}
                  color={active ? '#047857' : '#64748b'}
                />
                {badgeCount > 0 && (
                  <span
                    className="mobile-nav-badge"
                    aria-label={`${badgeCount} new items`}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-8px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      lineHeight: 1,
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '9999px',
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: active ? 700 : 500,
                  marginTop: '3px',
                  letterSpacing: '-0.2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '68px',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
