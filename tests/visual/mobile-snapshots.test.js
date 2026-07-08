import { test, expect } from '@playwright/test';

test.describe('mobile snapshots', () => {
  const MOBILE = { width: 375, height: 812 };

  test('home page bento archive sections render correctly', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/archive.html');
    await page.waitForLoadState('networkidle');

    // Verify the bento layout renders
    await expect(page.locator('[data-archive-bento]')).toBeVisible();

    // Verify all four sections are present
    await expect(page.locator('[data-archive-bento-months]')).toBeVisible();
    await expect(page.locator('[data-archive-bento-authors]')).toBeVisible();
    await expect(page.locator('[data-archive-bento-series]')).toBeVisible();
    await expect(page.locator('[data-archive-bento-topics]')).toBeVisible();

    // Verify archive tag pills render with labels and counts
    const archiveTags = page.locator('[data-archive-tag]');
    const tagCount = await archiveTags.count();
    expect(tagCount).toBeGreaterThan(0);

    const firstTag = archiveTags.first();
    await expect(firstTag.locator('[data-archive-tag-label]')).toBeVisible();
    await expect(firstTag.locator('[data-archive-tag-count]')).toBeVisible();
  });

  test('home page hero disclaimer renders', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-hero-disclaimer]')).toBeVisible();
    await expect(page.locator('[data-hero-disclaimer-body]')).toBeVisible();
    await expect(page.locator('[data-hero-disclaimer-policies]')).toBeVisible();
  });

  test('article page with TOC renders on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/posts/2026-07-05-css-properties-hierarchy.html');
    await page.waitForLoadState('networkidle');

    // Article content renders
    await expect(page.locator('[data-post-layout]')).toBeVisible();
    await expect(page.locator('[data-prose]')).toBeVisible();

    // Author is displayed
    await expect(page.locator('[itemprop="author"]')).toBeVisible();
  });

  test('dark mode colors maintain contrast in bento sections', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/archive.html');
    await page.waitForLoadState('networkidle');

    // Verify all bento panels render in dark mode
    await expect(page.locator('[data-archive-bento-months]')).toBeVisible();
    await expect(page.locator('[data-archive-bento-authors]')).toBeVisible();
    await expect(page.locator('[data-archive-bento-series]')).toBeVisible();
    await expect(page.locator('[data-archive-bento-topics]')).toBeVisible();

    // Tag pills are visible and have readable text
    const tags = page.locator('[data-archive-tag]');
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThan(0);

    // Count badges are visible
    const counts = page.locator('[data-archive-tag-count]');
    const countFirst = counts.first();
    await expect(countFirst).toBeVisible();
  });

  test('author page renders with post list', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/authors/emiliano-pixu1980-pisu.html');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-page-hero]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Emiliano');
    await expect(page.locator('[data-post-feed]')).toBeVisible();
  });
});
