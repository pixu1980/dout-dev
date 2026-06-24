import { test, expect } from '@playwright/test';

const ARTICLE_URL = '/posts/2026-06-13-how-pixhighlighter-is-built.html';
const LONG_CODE_TEXT = 'document.documentElement.dataset.pixHighlighterTheme';

test.describe('article inline code word-break on mobile', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  ];

  for (const vp of viewports) {
    test(`inline code does not overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(vp);
      await page.goto(ARTICLE_URL);
      await page.waitForLoadState('networkidle');

      // Find the <code> element with the long string
      const codeEl = page.locator('code').filter({ hasText: LONG_CODE_TEXT }).first();
      await expect(codeEl).toBeVisible();

      // Check code element fits inside viewport width
      const codeBox = await codeEl.boundingBox();
      expect(codeBox).not.toBeNull();

      const codeRightEdge = codeBox.x + codeBox.width;
      expect(codeRightEdge).toBeLessThanOrEqual(vp.width);

      // Check parent <p> doesn't overflow viewport
      const parentP = codeEl.locator('xpath=ancestor::p');
      const pBox = await parentP.boundingBox();
      expect(pBox).not.toBeNull();

      const pRightEdge = pBox.x + pBox.width;
      expect(pRightEdge).toBeLessThanOrEqual(vp.width);

      // Confirm code text is fully present
      const codeText = await codeEl.textContent();
      expect(codeText).toContain(LONG_CODE_TEXT);
    });
  }
});
