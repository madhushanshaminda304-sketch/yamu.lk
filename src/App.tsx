import React, { useSyncExternalStore, useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  PlusCircle,
  Car,
  UserCheck,
  SignIn,
  CheckCircle,
  ChatCircleDots,
} from '@phosphor-icons/react';
import { Toaster, toast } from 'sonner';

import { t, LOCALE_META, SUPPORTED_LOCALES } from './domain/i18n.ts';
import { computeUnreadMessagesCount } from './domain/inbox.ts';
import { createMarketplaceStore } from './state/store.ts';
import { initRemoteSync } from './state/supabaseSync.ts';
import { AuthModal } from './components/AuthModal.tsx';
import { YamoBrand } from './components/YamoLogo.tsx';
import { MobileTopBar } from './components/MobileTopBar.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { registerBackButtonHandler } from './native/backButton.ts';
import { setAppStatusBar } from './native/statusBar.ts';

import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { HomeView } from './views/HomeView.tsx';
import { SearchView } from './views/SearchView.tsx';
import { RideDetailView } from './views/RideDetailView.tsx';
import { PublishRideView } from './views/PublishRideView.tsx';
import { YourRidesView } from './views/YourRidesView.tsx';
import { InboxView } from './views/InboxView.tsx';
import { ProfileView } from './views/ProfileView.tsx';

// Singleton persistent store
const store = createMarketplaceStore();

export default function App() {
  const navigate = useNavigate();
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const locale = state.locale;
  const user = state.currentUser;

  useEffect(() => {
    initRemoteSync(store);
  }, []);

  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    onSuccess?: () => void;
  }>({ isOpen: false });

  const openAuthModal = (onSuccess?: () => void) => {
    setAuthModalState({ isOpen: true, onSuccess });
  };

  const closeAuthModal = () => {
    setAuthModalState({ isOpen: false });
  };

  useEffect(() => {
    // 1. Initialize native status bar styling with brand emerald and light text
    setAppStatusBar('#047857', true);

    // 2. Register Android hardware back button handler
    const unregisterBack = registerBackButtonHandler(
      (path) => {
        if (typeof path === 'number') {
          navigate(path);
        } else {
          navigate(path);
        }
      },
      () => authModalState.isOpen,
      () => closeAuthModal(),
      () => {
        toast('Press back again to exit Yamo', { duration: 2000 });
      }
    );

    return () => {
      unregisterBack();
    };
  }, [navigate, authModalState.isOpen]);

  return (
    <div className="app-root">
      {/* Sonner Toaster: Mounted once at application root with mobile bottom nav offset */}
      <Toaster richColors position="top-right" closeButton mobileOffset={{ bottom: 76 }} />

      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={closeAuthModal}
        onSuccess={authModalState.onSuccess}
        store={store}
      />

      {/* Mobile Top Header Bar: visible on mobile viewports (< 769px) */}
      <MobileTopBar state={state} store={store} openAuthModal={openAuthModal} />

      {/* Desktop Site Header: hidden on mobile viewports */}
      <header className="site-header hidden md:block">
        <div className="shell header-inner">
          <Link to="/" style={{ textDecoration: 'none' }} aria-label="Yamo Home">
            <YamoBrand />
          </Link>

          <nav className="nav-links">
            <Link to="/search" className="nav-item">
              <MagnifyingGlass size={18} weight="bold" />
              <span>{t(locale, 'nav.search')}</span>
            </Link>
            <Link to="/publish" className="nav-item">
              <PlusCircle size={18} weight="bold" />
              <span>{t(locale, 'nav.publish')}</span>
            </Link>
            <Link to="/rides" className="nav-item">
              <Car size={18} weight="bold" />
              <span>{t(locale, 'nav.rides')}</span>
              {state.bookings.length > 0 && (
                <span className="badge-pill">{state.bookings.length}</span>
              )}
            </Link>
            <Link to="/inbox" className="nav-item">
              <ChatCircleDots size={18} weight="bold" />
              <span>{t(locale, 'nav.inbox')}</span>
              {user &&
                computeUnreadMessagesCount(
                  state.messages,
                  state.lastReadAtByBooking,
                  user.id,
                  user.name
                ) > 0 && (
                  <span className="badge-pill">
                    {computeUnreadMessagesCount(
                      state.messages,
                      state.lastReadAtByBooking,
                      user.id,
                      user.name
                    )}
                  </span>
                )}
            </Link>
            {user ? (
              <Link to="/profile" className="nav-item">
                <UserCheck size={18} weight="bold" />
                <span>{user.name.split(' ')[0]}</span>
                {user.verifiedPhone && (
                  <CheckCircle size={14} color="#047857" weight="fill" />
                )}
              </Link>
            ) : (
              <button
                type="button"
                className="nav-item"
                onClick={() => openAuthModal()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                <SignIn size={18} weight="bold" />
                <span>Sign In</span>
              </button>
            )}

            <div className="lang-switch" role="group" aria-label="Language Switcher">
              {SUPPORTED_LOCALES.map((code) => {
                const meta = LOCALE_META[code];
                const active = locale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    className={`lang-btn ${active ? 'active' : ''}`}
                    onClick={() => store.setLocale(code)}
                    title={meta.fullLabel}
                    aria-pressed={active}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomeView state={state} />} />
            <Route path="/search" element={<SearchView state={state} store={store} />} />
            <Route path="/rides/:id" element={<RideDetailView state={state} store={store} openAuthModal={openAuthModal} />} />
            <Route path="/publish" element={<PublishRideView state={state} store={store} openAuthModal={openAuthModal} />} />
            <Route path="/rides" element={<YourRidesView state={state} store={store} openAuthModal={openAuthModal} />} />
            <Route path="/your-rides" element={<YourRidesView state={state} store={store} openAuthModal={openAuthModal} />} />
            <Route path="/inbox" element={<InboxView state={state} store={store} openAuthModal={openAuthModal} />} />
            <Route path="/profile" element={<ProfileView state={state} store={store} openAuthModal={openAuthModal} />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Mobile 5-Tab Bottom Navigation Bar: visible on mobile viewports (< 769px) */}
      <MobileBottomNav state={state} store={store} />

      {/* Desktop Website Footer: hidden on mobile viewports */}
      <footer className="site-footer hidden md:block" style={{ background: '#064e3b', color: '#ffffff', padding: '48px 0 32px', marginTop: '64px' }}>
        <div className="shell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b', marginBottom: '12px' }}>
                yamo<span style={{ color: '#ffffff' }}>.lk</span>
              </div>
              <p style={{ color: '#d1fae5', fontSize: '14px', lineHeight: 1.6 }}>
                Sri Lanka’s trusted intercity carpooling network. Share travel costs fairly on Southern Expressway (E01), Central Corridor (E04), and A9.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Top Corridors</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#a7f3d0' }}>
                <li><Link to="/search?from=colombo&to=kandy">Colombo ↔ Kandy (A1 / E04)</Link></li>
                <li><Link to="/search?from=makumbura&to=galle">Makumbura ↔ Galle (E01)</Link></li>
                <li><Link to="/search?from=colombo&to=matara">Colombo ↔ Matara (E01)</Link></li>
                <li><Link to="/search?from=colombo&to=jaffna">Colombo ↔ Jaffna (A9)</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Trust & Safety</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#a7f3d0' }}>
                <li>✓ Sri Lankan NIC & Driving Licence Verification</li>
                <li>✓ Super Driver Criteria & Rating System</li>
                <li>✓ Onboard Cash / LankaQR (Zero online payment)</li>
                <li>✓ Anti-Scam Phishing Protection</li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px', fontSize: '13px', color: '#a7f3d0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span>© {new Date().getFullYear()} Yamo.lk Carpooling. All rights reserved.</span>
            <span>Made for Sri Lanka · LKR Cost-Sharing Marketplace</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
