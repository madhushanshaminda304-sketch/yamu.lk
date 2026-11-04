import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Keep UI verification isolated from the live database and map providers.
  await page.route(/https:\/\/(?!127\.0\.0\.1)/, route => route.abort());
});

test('explicit URL language wins over a saved preference and survives refresh', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('yamo_locale', 'en-LK'));
  await page.goto('/si/search?from=colombo&to=galle&seats=2#results');
  await expect(page.locator('html')).toHaveAttribute('lang', 'si');
  await expect(page.getByRole('button', { name: 'සිංහල', exact: true }).filter({ visible: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('main')).toContainText('පෙරහන්');
  await expect(page.getByTestId('search-summary')).not.toContainText(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'si');
  await expect(page).toHaveURL(/\/si\/search\?from=colombo&to=galle&seats=2#results$/);
});

test('sign-in keeps entered values and translates errors when changing language inside the modal', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('blablacar_lk_auth_v1', JSON.stringify({ currentUser: null, registeredUsers: {} })));
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Sign In', exact: true }).filter({ visible: true }).click();
  await page.locator('.auth-modal-card input[type="tel"]').fill('12345');
  await page.getByRole('button', { name: 'Send Verification Code', exact: true }).click();
  await expect(page.locator('.auth-error-banner')).toContainText('Please enter a valid');
  await page.locator('.auth-modal-card select').selectOption('si-LK');
  await expect(page).toHaveURL('/si/');
  await expect(page.locator('.auth-modal-card input[type="tel"]')).toHaveValue('12345');
  await expect(page.locator('.auth-error-banner')).toContainText('වලංගු');
  await expect(page.locator('.auth-modal-card')).not.toContainText('Send Verification Code');
});

test('booking draft, selected seats and settlement survive switching languages', async ({ page }) => {
  await page.goto('/en/search?from=colombo&to=galle');
  await page.locator('.ride-card').first().click();
  await expect(page).toHaveURL(/\/en\/rides\//);
  await page.locator('#booking-note-textarea').fill('Please keep this note exactly as I wrote it.');
  await page.locator('input[value="cash_lkr"]').check();
  await page.getByRole('button', { name: 'தமிழ்', exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/ta\/rides\//);
  await expect(page.locator('#booking-note-textarea')).toHaveValue('Please keep this note exactly as I wrote it.');
  await expect(page.locator('input[value="cash_lkr"]')).toBeChecked();
});

test('switching language keeps search state, query, hash and localized navigation', async ({ page }) => {
  await page.goto('/en/search?from=colombo&to=galle&seats=2#results');
  const filter = page.locator('.filters-sidebar input[type="checkbox"]').first();
  await filter.check();
  await page.getByRole('button', { name: 'සිංහල', exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/si\/search\?from=colombo&to=galle&seats=2#results$/);
  await expect(filter).toBeChecked();
  await page.locator('.site-header a[href="/si/publish"]').click();
  await expect(page).toHaveURL('/si/publish');
  await page.goBack();
  await expect(page).toHaveURL(/\/si\/search/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'si');
});

test('publishing draft and wizard step survive a language change', async ({ page }) => {
  await page.goto('/en/publish');
  await page.locator('#publish-pickup-landmark').fill('My meeting point');
  await page.locator('#publish-dropoff-landmark').fill('My dropoff');
  await page.getByRole('button', { name: 'Choose route' }).click();
  await page.getByRole('button', { name: 'தமிழ்', exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL('/ta/publish');
  await expect(page.locator('main')).toContainText('வழித்தடத்தையும்');
  await page.locator('main .wizard-actions .btn-secondary').click();
  await expect(page.locator('#publish-pickup-landmark')).toHaveValue('My meeting point');
  await expect(page.locator('#publish-dropoff-landmark')).toHaveValue('My dropoff');
});

test('legacy deep links preserve parameters and root remembers the selected language', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('yamo_locale', 'ta-LK'));
  await page.goto('/search?from=kandy&to=colombo&seats=3');
  await expect(page).toHaveURL('/ta/search?from=kandy&to=colombo&seats=3');
  await page.goto('/');
  await expect(page).toHaveURL('/ta/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ta');
});

test('mobile language control and tabs use the correct route and active state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/si/');
  await page.locator('.mobile-top-bar select').selectOption('ta-LK');
  await expect(page).toHaveURL('/ta/');
  await page.locator('.mobile-bottom-nav button').nth(1).click();
  await expect(page).toHaveURL('/ta/publish');
  await expect(page.locator('.mobile-bottom-nav button').nth(1)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.mobile-top-bar h1')).not.toHaveText('Yamo');
  await page.screenshot({ path: 'test-results/tamil-mobile.png', fullPage: true });
});

test('localized metadata uses reciprocal alternatives and private pages are not indexed', async ({ page }) => {
  await page.goto('/si/search');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'http://127.0.0.1:4173/si/search');
  await expect(page.locator('link[hreflang="ta"]')).toHaveAttribute('href', 'http://127.0.0.1:4173/ta/search');
  await expect(page).not.toHaveTitle(/Search/);
  await page.goto('/ta/profile');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.goto('/si/missing-page');
  await expect(page.locator('main')).toContainText('පිටුව හමු නොවීය');
});
