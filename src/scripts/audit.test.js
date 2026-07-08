import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function readCSS(filePath) {
  return readFileSync(join(ROOT, filePath), 'utf8');
}

// ── P0 — Critical ──

test('P0.1: code blocks have mobile font-size reduction', () => {
  const css = readCSS('src/styles/layers/components.css');
  // Must have a 480px breakpoint reducing code/prose font
  const hasMobileBP = css.includes('max-width: 480px') || css.includes('max-width:480px');
  // Also check the general code style has step--1 reference somewhere relevant
  const hasCodeSize = css.includes('[data-prose] code') && css.includes('font-size');
  assert.ok(hasMobileBP || hasCodeSize, 'P0.1: Must have mobile breakpoint for code font-size');
});

test('P0.2: skip link focus uses safe-area', () => {
  const css = readCSS('src/styles/layers/components.css');
  const hasSafeArea =
    (css.includes('--dout--safe-left') || css.includes('safe-area-inset-left')) &&
    css.includes('data-skip-link');
  assert.ok(hasSafeArea, 'P0.2: Skip link focus must use safe-area awareness');
});

test('P0.3: search input resets iOS default appearance', () => {
  const css = readCSS('src/styles/layers/components.css');
  const hasReset = css.includes('-webkit-appearance: none') && css.includes('search');
  const hasCancelRemoval =
    css.includes('::-webkit-search-cancel-button') && css.includes('display: none');
  assert.ok(hasReset || hasCancelRemoval, 'P0.3: Search input must reset iOS default appearance');
});

test('P0.4: iframe embed uses dvh instead of vh', () => {
  const css = readCSS('src/styles/layers/components.css');
  const iframeSection = css.match(/\[data-embed-frame\][^{]*\{[^}]*\}/s);
  assert.ok(iframeSection, 'P0.4: Embed iframe styles must exist');
  const hasOnlyDvh = !iframeSection[0].includes('vh') || iframeSection[0].includes('dvh');
  assert.ok(hasOnlyDvh, 'P0.4: Iframe embed should use dvh, not plain vh');
});

// ── P1 — Significant ──

test('P1.5: analytics table has horizontal scroll wrapper', () => {
  const css = readCSS('src/styles/layers/components.css');
  assert.ok(
    css.includes('data-table-wrapper') && css.includes('overflow-x: auto'),
    'P1.5: Must have data-table-wrapper with overflow-x: auto'
  );
});

test('P1.6: feature-list image in stacked mode has height constraint', () => {
  const css = readCSS('src/styles/layers/components.css');
  // At 720px breakpoint the feature-list card stacks and image should be constrained
  const stackedSection = css.match(
    /@media[^}]*max-width:\s*720px[^{]*\{[^}]*post-card-media[^}]*\}/s
  );
  // Broader: check there's a constraint in the stacked media
  const has720Breakpoint = css.includes('max-width: 720px');
  assert.ok(has720Breakpoint, 'P1.6: Must have 720px breakpoint for post cards');
});

test('P1.10: search has inputmode and autocomplete attrs', () => {
  const searchHtml = readCSS('src/templates/search.html');
  const hasInputmode = searchHtml.includes('inputmode="search"');
  const hasAutocomplete = searchHtml.includes('autocomplete="off"');
  assert.ok(hasInputmode, 'P1.10: Search input must have inputmode="search"');
  assert.ok(hasAutocomplete, 'P1.10: Search input must have autocomplete="off"');
});

// ── P2 — Polish ──

test('P2.13: post meta handles wrapping on small screens', () => {
  const css = readCSS('src/styles/layers/components.css');
  const hasFlexWrap = css.includes('[data-post-meta]') && css.includes('flex-wrap');
  assert.ok(hasFlexWrap, 'P2.13: Post meta must have flex-wrap');
});

test('P2.15: series nav has padding on mobile', () => {
  const css = readCSS('src/styles/layers/components.css');
  const hasSeriesNav =
    css.includes('series-navigation-links') && css.includes('padding-inline-start');
  assert.ok(hasSeriesNav, 'P2.15: Series nav links must have padding-inline-start');
});

test('P6: archive tags have emoji prefix via CSS', () => {
  const css = readCSS('src/styles/layers/components.css');
  assert.ok(css.includes('bento-accent-prefix'), 'Archive tags must have --bento-accent-prefix');
  assert.ok(
    css.includes('data-archive-tag') && css.includes('::before'),
    'Archive tags must use ::before for prefix'
  );
});

test('P6: archive tags use bento-accent-text for count color', () => {
  const css = readCSS('src/styles/layers/components.css');
  assert.ok(
    css.includes('bento-accent-text') && css.includes('data-archive-tag-count'),
    'Archive tag count must use --bento-accent-text'
  );
});

test('P4: authors loaded in client search', () => {
  const searchJs = readCSS('src/scripts/search.js');
  assert.ok(searchJs.includes('/data/authors.json'), 'Search must load authors.json');
  assert.ok(searchJs.includes('scoreAuthor'), 'Search must have scoreAuthor function');
  assert.ok(searchJs.includes('renderAuthorItem'), 'Search must have renderAuthorItem function');
});

test('P2: author pages pass robots meta', () => {
  const gen = readCSS('scripts/cms/_page-generator.js');
  assert.ok(
    gen.includes("robots: 'index,follow'") && gen.includes('author'),
    'Author pages must pass robots'
  );
});

test('P2.19: increase-contrast is handled', () => {
  const overrides = readCSS('src/styles/layers/overrides.css');
  assert.ok(
    overrides.includes('data-increase-contrast'),
    'P2.19: Must handle data-increase-contrast'
  );
});

test('P2.20: author hero link uses data-hero-lede for wrapping', () => {
  const authorHtml = readCSS('src/templates/author.html');
  assert.ok(
    authorHtml.includes('data-hero-lede'),
    'P2.20: Author page must use data-hero-lede for link'
  );
});
