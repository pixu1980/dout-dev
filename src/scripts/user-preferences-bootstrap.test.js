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
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-display'),
      /system-ui/i
    );
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-sans'),
      /system-ui/i
    );
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-mono'),
      /ui-monospace/i
    );
  });

  test('applies saved OpenDyslexic heading and body fonts before revealing the page', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.displayPreferences,
      JSON.stringify({ bodyFont: 'open-dyslexic', headingFont: 'open-dyslexic' })
    );
    document.documentElement.dataset.userPreferences = 'loading';

    const applied = bootUserPreferences();

    assert.equal(applied.displayPreferences.bodyFont, 'open-dyslexic');
    assert.equal(applied.displayPreferences.headingFont, 'open-dyslexic');
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-display'),
      /OpenDyslexic/
    );
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-sans'),
      /OpenDyslexic/
    );
    assert.equal(document.documentElement.dataset.userPreferences, 'ready');
  });
});
