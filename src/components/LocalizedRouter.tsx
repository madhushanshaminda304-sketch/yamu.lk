import React, { useLayoutEffect } from 'react';
import {
  Link as RouterLink, Navigate, Route, Routes, useLocation as useRouterLocation,
  useNavigate as useRouterNavigate, type LinkProps, type NavigateFunction, type NavigateOptions, type To,
} from 'react-router-dom';
import { localeFromPath, localizedPath, stripLanguagePrefix } from '../domain/languageRoutes.ts';
import { type LocaleCode } from '../domain/i18n.ts';
import { defaultMarketplaceStore } from '../state/store.ts';

function localizeTo(to: To, locale: LocaleCode): To {
  return typeof to === 'string' ? localizedPath(to, locale)
    : { ...to, ...(to.pathname ? { pathname: localizedPath(to.pathname, locale) } : {}) };
}

export function Link({ to, ...props }: LinkProps) {
  const location = useRouterLocation();
  const locale = localeFromPath(location.pathname) ?? defaultMarketplaceStore.getState().locale;
  return <RouterLink {...props} to={localizeTo(to, locale)} />;
}

export function useNavigate(): NavigateFunction {
  const navigate = useRouterNavigate();
  const location = useRouterLocation();
  return ((to: To | number, options?: NavigateOptions) => {
    if (typeof to === 'number') return navigate(to);
    const locale = localeFromPath(location.pathname) ?? defaultMarketplaceStore.getState().locale;
    return navigate(localizeTo(to, locale), options);
  }) as NavigateFunction;
}

/** Existing screen navigation uses paths relative to the language root. */
export function useLocation() {
  const location = useRouterLocation();
  return { ...location, pathname: stripLanguagePrefix(location.pathname) };
}

export function useLanguageChange() {
  const location = useRouterLocation();
  const navigate = useRouterNavigate();
  return (locale: LocaleCode) => {
    defaultMarketplaceStore.setLocale(locale);
    navigate(localizedPath(location.pathname, locale) + location.search + location.hash,
      { replace: true, state: location.state });
  };
}

function LanguageBoundary({ children }: { children: React.ReactNode }) {
  const location = useRouterLocation();
  const locale = localeFromPath(location.pathname);
  useLayoutEffect(() => {
    if (locale && defaultMarketplaceStore.getState().locale !== locale) {
      defaultMarketplaceStore.setLocale(locale);
    }
  }, [locale]);
  if (!locale) {
    return <Navigate replace to={localizedPath(location.pathname, defaultMarketplaceStore.getState().locale)
      + location.search + location.hash} state={location.state} />;
  }
  return <>{children}</>;
}

export function LocalizedRoutes({ children }: { children: React.ReactNode }) {
  // One stable route keeps screen state mounted when only the language changes.
  return <Routes><Route path=":language/*" element={<LanguageBoundary>{children}</LanguageBoundary>} />
    <Route path="*" element={<LegacyRedirect />} /></Routes>;
}

function LegacyRedirect() {
  const location = useRouterLocation();
  return <Navigate replace to={localizedPath(location.pathname, defaultMarketplaceStore.getState().locale)
    + location.search + location.hash} state={location.state} />;
}
