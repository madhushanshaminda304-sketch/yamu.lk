import { test, expect, type Page } from '@playwright/test';

async function expectContainedControls(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const failures = await page.evaluate(() => {
    function inScrollableStrip(element: Element) {
      for (let parent = element.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (['auto', 'scroll'].includes(style.overflowX) && parent.scrollWidth > parent.clientWidth + 2) return true;
      }
      return false;
    }
    return [...document.querySelectorAll('button,select,input,textarea,h1,h2,h3,.mobile-nav-item > span')]
      .filter(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && !inScrollableStrip(element);
      }).flatMap(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const outside = rect.left < -2 || rect.right > innerWidth + 2;
        const clipped = element.scrollWidth > element.clientWidth + 2 &&
          (['hidden', 'clip'].includes(style.overflowX) || element.matches('.mobile-page-title h1,.mobile-nav-item > span'));
        return outside || clipped ? [{ text: (element.textContent || (element as HTMLInputElement).placeholder || element.tagName).trim().slice(0, 90), outside, clipped, width: Math.round(rect.width), scroll: element.scrollWidth }] : [];
      });
  });
  expect(failures, `${page.url()} contains off-screen or clipped interface controls`).toEqual([]);
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    outside: [...document.querySelectorAll('main *')].filter(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      if (!rect.width || rect.right <= innerWidth + 2 || element.closest('.maplibregl-map')) return false;
      for (let parent = element.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
        if (['auto','scroll'].includes(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth + 2) return false;
      }
      return true;
    }).slice(0, 12).map(element => ({ tag: element.tagName, class: element.className, text: element.textContent?.trim().slice(0, 100), width: Math.round(element.getBoundingClientRect().width) })),
  }));
  expect(size.width, `${page.url()}: ${JSON.stringify(size.outside)}`).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 2);
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

for (const language of ['en', 'si', 'ta']) {
  for (const width of [320, 390, 1280]) {
    test(`${language} controls fit at ${width}px, including all publishing steps`, async ({ page }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['', 'search', 'rides', 'inbox', 'profile']) {
        await page.goto(`/${language}/${route}`, { waitUntil: 'networkidle' });
        await expectContainedControls(page);
        const fontsLoaded = await page.evaluate(language => {
          const family = language === 'si' ? 'Noto Sans Sinhala' : language === 'ta' ? 'Noto Sans Tamil' : 'Manrope';
          return [...document.fonts].some(font => font.family.replaceAll('"', '').replaceAll("'", '') === family && font.status === 'loaded');
        }, language);
        expect(fontsLoaded, 'The bundled font for the active language must load').toBe(true);
        if (width === 390 && ['','search'].includes(route)) await page.screenshot({ path: `test-results/refined-${language}-${route || 'home'}.png`, fullPage: true });
      }
      await page.goto(`/${language}/publish`);
      for (let step = 1; step <= 6; step++) {
        await expectContainedControls(page);
        if (width === 390 && language !== 'en' && [1,4,6].includes(step)) await page.screenshot({ path: `test-results/refined-${language}-publish-${step}.png`, fullPage: true });
        if (step < 6) await page.locator('main .btn-primary').last().click();
      }
      await page.goto(`/${language}/search?from=colombo&to=galle`);
      await page.locator('.ride-card').first().click();
      await expectContainedControls(page);
      await expect(page.getByTestId('booking-confirm')).toBeVisible();
      if (width === 390 && language !== 'en') await page.screenshot({ path: `test-results/refined-${language}-booking.png`, fullPage: true });
    });
  }
}

test('Russian is retired and its deep links preserve the destination', async ({ page }) => {
  await page.goto('/ru/search?from=colombo&to=galle&seats=2');
  await expect(page).toHaveURL('/en/search?from=colombo&to=galle&seats=2');
  await expect(page.locator('option[value="ru-RU"],button[lang="ru"],link[hreflang="ru"]')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.mobile-top-bar select option')).toHaveCount(3);
});
