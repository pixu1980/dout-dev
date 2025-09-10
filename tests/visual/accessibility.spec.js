import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { test } from '@playwright/test';

const DIST_DIR = join(process.cwd(), 'dist');
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const THIRD_PARTY_FRAME_SELECTORS = ['.embed-frame--codepen', 'iframe.giscus-frame'];

function collectHtmlRoutes(dir, routes = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      collectHtmlRoutes(fullPath, routes);
      continue;
    }

    if (!entry.endsWith('.html')) continue;

    const routePath = relative(DIST_DIR, fullPath).replaceAll('\\', '/');
    if (routePath === 'index.html') {
      routes.push('/');
      continue;
    }

    if (routePath.endsWith('/index.html')) {
      routes.push(`/${routePath.slice(0, -'index.html'.length)}`);
      continue;
    }

    routes.push(`/${routePath}`);
  }

  return routes;
}

const ROUTES = collectHtmlRoutes(DIST_DIR).sort((left, right) => left.localeCompare(right));

async function analyzePage(page) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_AA_TAGS);

  // Keep the gate focused on first-party DOM. External widgets are audited separately.
  for (const selector of THIRD_PARTY_FRAME_SELECTORS) {
    builder = builder.exclude(selector);
  }

  return builder.analyze();
}

function formatViolations(route, violations) {
  return violations.map((violation) => {
    const targets = violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(' '))
      .join(' | ');

    return `${route}: [${violation.id}] ${violation.help} :: ${targets}`;
  });
}

test('all generated pages pass axe-core WCAG AA checks', async ({ page }) => {
  test.setTimeout(240_000);

  const failures = [];

  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);

    const { violations } = await analyzePage(page);
    failures.push(...formatViolations(route, violations));
  }

  if (failures.length) {
    throw new Error(`axe violations found:\n${failures.join('\n')}`);
  }
});

test('interactive header states pass axe-core WCAG AA checks', async ({ page }) => {
  test.setTimeout(60_000);

  const failures = [];

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(150);

  await page.locator('.menu-toggle').click();
  let analysis = await analyzePage(page);
  failures.push(...formatViolations('/ [mobile-nav-open]', analysis.violations));

  await page.locator('.preferences-toggle').click();
  await page.waitForTimeout(150);
  analysis = await analyzePage(page);
  failures.push(...formatViolations('/ [preferences-open]', analysis.violations));

  if (failures.length) {
    throw new Error(`axe violations found in interactive states:\n${failures.join('\n')}`);
  }
});
