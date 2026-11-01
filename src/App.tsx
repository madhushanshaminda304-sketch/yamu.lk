import React, { useSyncExternalStore, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import {
  MagnifyingGlass,
  PlusCircle,
  Car,
  UserCheck,
  SignIn,
  CheckCircle,
} from '@phosphor-icons/react';
import { Toaster } from 'sonner';

import { t } from './domain/i18n.ts';
import { createMarketplaceStore } from './state/store.ts';
import { AuthModal } from './components/AuthModal.tsx';
import { YamuBrand } from './components/YamuLogo.tsx';

import { HomeView } from './views/HomeView.tsx';
import { SearchView } from './views/SearchView.tsx';
import { RideDetailView } from './views/RideDetailView.tsx';
import { PublishRideView } from './views/PublishRideView.tsx';
import { YourRidesView } from './views/YourRidesView.tsx';
import { ProfileView } from './views/ProfileView.tsx';

// Singleton persistent store
const store = createMarketplaceStore();

export default function App() {
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const locale = state.locale;
  const user = state.currentUser;

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

  return (
    <div className="app-root">
      {/* Sonner Toaster: Mounted once at application root */}
      <Toaster richColors position="top-right" closeButton />

      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={closeAuthModal}
        onSuccess={authModalState.onSuccess}
        store={store}
      />

      <header className="site-header">
        <div className="shell header-inner">
          <Link to="/" style={{ textDecoration: 'none' }} aria-label="Yamu Home">
            <YamuBrand />
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
            {user ? (
              <Link to="/profile" className="nav-item">
                <UserCheck size={18} weight="bold" />
                <span>{user.name.split(' ')[0]}</span>
                {user.verifiedPhone && (
                  <CheckCircle size={14} color="#00aff5" weight="fill" />
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
              <button
                type="button"
                className={`lang-btn ${locale === 'en-LK' ? 'active' : ''}`}
                onClick={() => store.setLocale('en-LK')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${locale === 'si-LK' ? 'active' : ''}`}
                onClick={() => store.setLocale('si-LK')}
              >
                සිං
              </button>
              <button
                type="button"
                className={`lang-btn ${locale === 'ta-LK' ? 'active' : ''}`}
                onClick={() => store.setLocale('ta-LK')}
              >
                தமிழ்
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomeView state={state} />} />
          <Route path="/search" element={<SearchView state={state} store={store} />} />
          <Route path="/rides/:id" element={<RideDetailView state={state} store={store} openAuthModal={openAuthModal} />} />
          <Route path="/publish" element={<PublishRideView state={state} store={store} openAuthModal={openAuthModal} />} />
          <Route path="/rides" element={<YourRidesView state={state} store={store} openAuthModal={openAuthModal} />} />
          <Route path="/profile" element={<ProfileView state={state} store={store} openAuthModal={openAuthModal} />} />
        </Routes>
      </main>

      <footer style={{ background: '#054752', color: '#ffffff', padding: '48px 0 32px', marginTop: '64px' }}>
        <div className="shell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#00aff5', marginBottom: '12px' }}>
                yamu<span style={{ color: '#ffffff' }}>.lk</span>
              </div>
              <p style={{ color: '#b2c8cc', fontSize: '14px', lineHeight: 1.6 }}>
                Sri Lanka’s trusted intercity carpooling network. Share travel costs fairly on Southern Expressway (E01), Central Corridor (E04), and A9.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Top Corridors</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#b2c8cc' }}>
                <li><Link to="/search?from=colombo&to=kandy">Colombo ↔ Kandy (A1 / E04)</Link></li>
                <li><Link to="/search?from=makumbura&to=galle">Makumbura ↔ Galle (E01)</Link></li>
                <li><Link to="/search?from=colombo&to=matara">Colombo ↔ Matara (E01)</Link></li>
                <li><Link to="/search?from=colombo&to=jaffna">Colombo ↔ Jaffna (A9)</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Trust & Safety</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#b2c8cc' }}>
                <li>✓ Sri Lankan NIC & Driving Licence Verification</li>
                <li>✓ Super Driver Criteria & Rating System</li>
                <li>✓ Onboard Cash / LankaQR (Zero online payment)</li>
                <li>✓ Anti-Scam Phishing Protection</li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', fontSize: '13px', color: '#8fa5a9', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span>© {new Date().getFullYear()} Yamu.lk Carpooling. All rights reserved.</span>
            <span>Made for Sri Lanka · LKR Cost-Sharing Marketplace</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
