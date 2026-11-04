import fs from 'node:fs/promises';
import path from 'node:path';
import { t, LOCALE_META, SUPPORTED_LOCALES } from '../src/domain/i18n.ts';
import { getHubById, getHubDisplayName } from '../src/domain/corridors.ts';
import { localizedPath } from '../src/domain/languageRoutes.ts';

// Emit the public homepage content and metadata before JavaScript runs.
// Dynamic search results and private account screens remain client rendered.
const output = path.resolve('dist');
const template = await fs.readFile(path.join(output, 'index.html'), 'utf8');
const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL;
const origin = siteUrl ? new URL(siteUrl).origin : null;
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
for (const locale of SUPPORTED_LOCALES) {
  const language = LOCALE_META[locale].langCode;
  const title = `${t(locale, 'brand.tagline')} | Yamo`;
  const description = t(locale, 'hero.subtitle');
  const languages = SUPPORTED_LOCALES.map(code => `<a href="${localizedPath('/', code)}" lang="${LOCALE_META[code].langCode}" hreflang="${LOCALE_META[code].langCode}">${escape(LOCALE_META[code].fullLabel)}</a>`).join(' · ');
  const corridors = [['colombo', 'kandy'], ['makumbura', 'galle'], ['colombo', 'matara'], ['colombo', 'jaffna']]
    .map(([from, to]) => `<li><a href="${localizedPath('/search', locale)}?from=${from}&amp;to=${to}">${escape(getHubDisplayName(getHubById(from), locale))} → ${escape(getHubDisplayName(getHubById(to), locale))}</a></li>`).join('');
  const content = `<header class="shell"><a href="/${language}/">Yamo</a><nav aria-label="${escape(t(locale, 'nav.search'))}">${languages}</nav></header>
    <main><section class="hero-section"><div class="shell hero-content"><h1 class="hero-title">${escape(t(locale, 'hero.title'))}</h1><p class="hero-subtitle">${escape(description)}</p>
    <a class="btn-primary" href="/${language}/search">${escape(t(locale, 'nav.search'))}</a> <a class="btn-secondary" href="/${language}/publish">${escape(t(locale, 'nav.publish'))}</a></div></section>
    <section class="shell">${[1, 2, 3].map(i => `<h2>${escape(t(locale, `usp.${i}.title`))}</h2><p>${escape(t(locale, `usp.${i}.body`))}</p>`).join('')}<ul>${corridors}</ul><p>${escape(t(locale, 'scam.banner'))}</p></section></main>`;
  let html = template.replace(/<html lang="[^"]*">/, `<html lang="${language}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*("\s*\/?>)/, `$1${escape(description)}$2`)
    .replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*("\s*\/?>)/g, `$1${escape(title)}$2`)
    .replace(/(<meta (?:property|name)="(?:og|twitter):description" content=")[^"]*("\s*\/?>)/g, `$1${escape(description)}$2`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  if (origin) {
    const links = `<link rel="canonical" href="${origin}/${language}/" />` + SUPPORTED_LOCALES.map(code => `<link rel="alternate" hreflang="${LOCALE_META[code].langCode}" href="${origin}/${LOCALE_META[code].langCode}/" />`).join('') + `<link rel="alternate" hreflang="x-default" href="${origin}/en/" />`;
    html = html.replace('</head>', `${links}</head>`);
  }
  await fs.mkdir(path.join(output, language), { recursive: true });
  await fs.writeFile(path.join(output, language, 'index.html'), html);
  if (language === 'en') await fs.writeFile(path.join(output, 'index.html'), html);
}
console.log('Prerendered English, Sinhala, Tamil and Russian homepages' + (origin ? ` for ${origin}` : '. Set SITE_URL for build-time canonical and hreflang URLs.'));
