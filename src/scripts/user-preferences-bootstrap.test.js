import assert from 'node:assert/strict';
import { before, beforeEach, describe, test } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'https://dout.dev/',
});

global.window = dom.window;
global.document = dom.window.document;

let bootUserPreferences, STORAGE_KEYS;

before(async () => {
  const mod = await import(new URL('./user-preferences-bootstrap.js?test', import.meta.url));
  ({ bootUserPreferences, STORAGE_KEYS } = mod);
});

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-color-scheme');
  document.documentElement.removeAttribute('data-increase-contrast');
  document.documentElement.removeAttribute('data-post-feed-layout');
  document.documentElement.removeAttribute('data-radius-preset');
  document.documentElement.removeAttribute('data-reduce-motion');
  document.documentElement.removeAttribute('data-reduce-transparency');
  document.documentElement.removeAttribute('data-user-preferences');
  document.documentElement.style.colorScheme = '';
  document.documentElement.style.removeProperty('--dout--accent-h');
  document.documentElement.style.removeProperty('--dout--accent-s');
  document.documentElement.style.removeProperty('--dout--accent-l');
  document.documentElement.style.removeProperty('--dout--font-display');
  document.documentElement.style.removeProperty('--dout--font-mono');
  document.documentElement.style.removeProperty('--dout--font-sans');
  document.documentElement.style.removeProperty('font-size');
  window.localStorage.clear();
});

describe('user preferences bootstrap', () => {
  test('applies saved localStorage preferences before revealing the page', () => {
    window.localStorage.setItem(STORAGE_KEYS.colorScheme, 'dark');
    window.localStorage.setItem(STORAGE_KEYS.accentColor, 'mint');
    window.localStorage.setItem(STORAGE_KEYS.postFeedLayout, 'grid');
    window.localStorage.setItem(
      STORAGE_KEYS.displayPreferences,
      JSON.stringify({
        bodyFont: 'book-serif',
        codeFont: 'system-mono',
        fontScale: '125%',
        headingFont: 'system-sans',
        increaseContrast: true,
        radiusPreset: 'squircle',
        reduceMotion: true,
        reduceTransparency: true,
      })
    );
    document.documentElement.dataset.userPreferences = 'loading';

    const applied = bootUserPreferences();

    assert.equal(document.documentElement.dataset.userPreferences, 'ready');
    assert.equal(applied.colorScheme, 'dark');
    assert.equal(document.documentElement.dataset.colorScheme, 'dark');
    assert.equal(document.documentElement.style.colorScheme, 'dark');
    assert.equal(document.querySelector('meta[name="color-scheme"]')?.content, 'dark');
    assert.equal(document.documentElement.style.getPropertyValue('--dout--accent-h'), '145');
    assert.equal(document.documentElement.style.getPropertyValue('--dout--accent-s'), '80%');
    assert.equal(document.documentElement.style.getPropertyValue('--dout--accent-l'), '60%');
    assert.equal(document.documentElement.dataset.postFeedLayout, 'grid');
    assert.equal(document.documentElement.dataset.radiusPreset, 'squircle');
    assert.equal(document.documentElement.getAttribute('data-increase-contrast'), 'true');
    assert.equal(document.documentElement.getAttribute('data-reduce-motion'), 'true');
    assert.equal(document.documentElement.getAttribute('data-reduce-transparency'), 'true');
    assert.equal(document.documentElement.style.fontSize, '125%');
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-display'),
      /system-ui/i
    );
    assert.match(document.documentElement.style.getPropertyValue('--dout--font-sans'), /Georgia/i);
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-mono'),
      /ui-monospace/i
    );
  });

  test('uses defaults and still marks preferences ready when storage is empty', () => {
    document.documentElement.dataset.userPreferences = 'loading';

    const applied = bootUserPreferences();

    assert.equal(document.documentElement.dataset.userPreferences, 'ready');
    assert.equal(applied.colorScheme, 'system');
    assert.equal(document.documentElement.hasAttribute('data-color-scheme'), false);
    assert.equal(document.documentElement.style.colorScheme, 'light dark');
    assert.equal(document.querySelector('meta[name="color-scheme"]')?.content, 'light dark');
    assert.equal(applied.accentColor, 'coral');
    assert.equal(document.documentElement.style.getPropertyValue('--dout--accent-h'), '16');
    assert.equal(document.documentElement.dataset.postFeedLayout, 'list');
    assert.equal(document.documentElement.dataset.radiusPreset, 'rounded');
    assert.equal(document.documentElement.hasAttribute('data-increase-contrast'), false);
    assert.equal(document.documentElement.style.fontSize, '');
  });

  test('builds a dynamic DOM-based skeleton and keeps it visible for fifteen render frames', () => {
    const frameCallbacks = [];
    const frameWindow = {
      requestAnimationFrame(callback) {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      },
    };
    document.body.innerHTML = `
      <div data-preferences-skeleton aria-hidden="true" inert></div>
      <a data-skip-link href="#main">Skip to main content</a>
      <div id="page-announcer" data-visually-hidden aria-live="polite"></div>
      <header data-site-header><a data-brand href="/">dout.dev</a><nav><a href="/archive.html">Archive</a></nav></header>
      <main data-site-main id="main"><section data-hero data-hero-variant="home"><div data-hero-copy><h1>Title</h1><p>Summary text</p><img src="/cover.png" alt="Cover" /></div></section></main>
      <footer data-site-footer><p>Footer text</p></footer>
      <script type="module" src="/scripts/main.js"></script>
    `;
    document.documentElement.dataset.userPreferences = 'loading';

    const applied = bootUserPreferences({ window: frameWindow });
    const skeleton = document.querySelector('[data-preferences-skeleton]');

    assert.equal(applied.colorScheme, 'system');
    assert.equal(skeleton?.dataset.skeletonGenerated, 'true');
    assert.equal(skeleton?.hasAttribute('inert'), true);
    assert.notEqual(skeleton?.querySelector('[data-site-header][data-skeleton-node="true"]'), null);
    assert.notEqual(skeleton?.querySelector('[data-site-main][data-skeleton-node="true"]'), null);
    assert.notEqual(skeleton?.querySelector('[data-site-footer][data-skeleton-node="true"]'), null);
    assert.equal(skeleton?.querySelector('[data-skip-link]'), null);
    assert.equal(skeleton?.querySelector('script'), null);
    assert.equal(skeleton?.querySelector('img'), null);
    assert.notEqual(
      skeleton?.querySelector('[data-skeleton-media][data-skeleton-tag="img"]'),
      null
    );
    assert.equal(skeleton?.textContent.trim(), '');
    assert.ok((skeleton?.querySelectorAll('[data-skeleton-text]').length || 0) >= 5);
    assert.equal(document.documentElement.dataset.userPreferences, 'loading');
    assert.equal(frameCallbacks.length, 1);

    for (let frameIndex = 0; frameIndex < 14; frameIndex += 1) {
      frameCallbacks.shift()(frameIndex * 16);
      assert.equal(document.documentElement.dataset.userPreferences, 'loading');
      assert.equal(frameCallbacks.length, 1);
    }

    frameCallbacks.shift()(224);

    assert.equal(document.documentElement.dataset.userPreferences, 'ready');
  });
});
