import { expect, test } from '@playwright/test';

const DISPLAY_PREFERENCES = {
  bodyFont: 'humanist-sans',
  codeFont: 'plex-mono',
  fontScale: '100%',
  headingFont: 'editorial-serif',
  increaseContrast: false,
  reduceAnimations: true,
  reduceMotion: true,
  reduceTransparency: true,
};

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'archive', path: '/archive.html' },
  { name: 'privacy', path: '/privacy.html' },
  { name: 'post', path: '/posts/2022-03-24-welcome-to-dout-dev.html' },
];

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript((preferences) => {
    window.localStorage.setItem('display-preferences', JSON.stringify(preferences));
  }, DISPLAY_PREFERENCES);

  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const route of ROUTES) {
  test(`${route.name} page matches the visual baseline`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
  });
}
