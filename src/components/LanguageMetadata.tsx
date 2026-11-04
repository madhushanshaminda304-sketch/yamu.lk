import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LOCALE_META, SUPPORTED_LOCALES, t } from '../domain/i18n.ts';
import { localizedPath, stripLanguagePrefix } from '../domain/languageRoutes.ts';
import { useUiText } from './useUiText.ts';

export function LanguageMetadata() {
  const location = useLocation();
  const { uiLocale, tr } = useUiText();
  useEffect(() => {
    const path = stripLanguagePrefix(location.pathname);
    const publicPage = path === '/' || path === '/search' || /^\/rides\/[^/]+$/.test(path);
    const label = path === '/' ? t(uiLocale, 'brand.tagline')
      : path === '/search' ? t(uiLocale, 'nav.search')
      : /^\/rides\/[^/]+$/.test(path) ? tr('Ride Details')
      : path === '/publish' ? t(uiLocale, 'nav.publish')
      : path === '/profile' ? t(uiLocale, 'nav.profile')
      : path === '/inbox' ? t(uiLocale, 'nav.inbox')
      : ['/rides', '/your-rides'].includes(path) ? t(uiLocale, 'nav.rides') : tr('Page not found');
    document.documentElement.lang = LOCALE_META[uiLocale].langCode;
    document.title = `${label} | Yamo`;
    function meta(name: string, content: string) {
      let node = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!node) { node = document.createElement('meta'); node.name = name; document.head.appendChild(node); }
      node.content = content;
    }
    meta('description', t(uiLocale, 'brand.tagline'));
    meta('twitter:title', document.title);
    meta('twitter:description', t(uiLocale, 'brand.tagline'));
    for (const property of ['og:title', 'og:description']) {
      const node = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (node) node.content = property === 'og:title' ? document.title : t(uiLocale, 'brand.tagline');
    }
    meta('robots', publicPage ? 'index,follow' : 'noindex,follow');
    const links: HTMLLinkElement[] = [];
    document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach(node => node.remove());
    function link(rel: string, href: string, language?: string) {
      const node = document.createElement('link'); node.rel = rel; node.href = href;
      if (language) node.hreflang = language;
      document.head.appendChild(node); links.push(node);
    }
    if (publicPage && /^https?:/.test(window.location.protocol)) {
      link('canonical', locationOrigin() + localizedPath(path, uiLocale));
      for (const locale of SUPPORTED_LOCALES) link('alternate', locationOrigin() + localizedPath(path, locale), LOCALE_META[locale].langCode);
      link('alternate', locationOrigin() + localizedPath(path, 'en-LK'), 'x-default');
    }
    return () => links.forEach(node => node.remove());
  }, [location.pathname, uiLocale]);
  return null;
}

function locationOrigin() { return window.location.origin; }
