import React from 'react';
import { Link } from './LocalizedRouter.tsx';
import { useUiText } from './useUiText.ts';

export function NotFound() {
  const { tr } = useUiText();
  return <section className="shell" style={{ padding: '64px 16px' }}>
    <h1>{tr('Page not found')}</h1>
    <p>{tr('This page may have moved. Search for a ride to continue.')}</p>
    <Link className="btn-primary" to="/search">{tr('Search Rides')}</Link>
  </section>;
}
