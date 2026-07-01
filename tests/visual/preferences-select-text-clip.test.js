import { test, expect } from '@playwright/test';

const HOME_URL = '/';

test.describe('preferences popover select text clipping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');

    // Use the real popover (not the skeleton placeholder)
    const popover = page.locator('display-preferences-popover').last();
    await popover.waitFor({ state: 'attached' });

    // Open it by clicking the toggle button
    const toggle = popover.locator('[data-preferences-toggle]');
    await toggle.click();
  });

  test('select options in [data-preferences-field] are fully readable', async ({ page }) => {
    const panel = page.locator('[data-preferences-panel]');

    const selects = panel.locator('[data-preferences-field] select');
    const count = await selects.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const select = selects.nth(i);

      // Check each option's text is present in the DOM
      const options = await select.locator('option').all();
      for (const option of options) {
        const text = await option.textContent();
        expect(text).not.toBeNull();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('select text is not clipped by overflow on Chrome', async ({ page }) => {
    const panel = page.locator('[data-preferences-panel]');
    const selects = panel.locator('[data-preferences-field] select');
    const count = await selects.count();

    for (let i = 0; i < count; i++) {
      const select = selects.nth(i);

      // Check that the select's rendered text is not clipped
      const isClipped = await select.evaluate((el) => {
        return el.scrollWidth > el.clientWidth;
      });
      expect(isClipped).toBe(false);

      // Verify no text-overflow ellipsis is clipping text
      const textOverflow = await select.evaluate((el) => {
        return window.getComputedStyle(el).textOverflow;
      });
      expect(textOverflow).not.toBe('ellipsis');
    }
  });

  test('select has enough padding for text on Chrome', async ({ page }) => {
    const panel = page.locator('[data-preferences-panel]');
    const selects = panel.locator('[data-preferences-field] select');
    const count = await selects.count();

    for (let i = 0; i < count; i++) {
      const select = selects.nth(i);

      const padding = await select.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          paddingLeft: parseFloat(style.paddingLeft),
          paddingRight: parseFloat(style.paddingRight),
          fontSize: parseFloat(style.fontSize),
        };
      });

      // There should be at least some horizontal padding (>= 4px each side)
      expect(padding.paddingLeft).toBeGreaterThanOrEqual(4);
      expect(padding.paddingRight).toBeGreaterThanOrEqual(4);

      // Font size should be readable (>= 14px)
      expect(padding.fontSize).toBeGreaterThanOrEqual(14);
    }
  });
});
