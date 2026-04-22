import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, beforeEach, describe, test } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'https://dout.dev/',
});

global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: dom.window.navigator,
});
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.CustomEvent = dom.window.CustomEvent;
global.customElements = dom.window.customElements;

function installAdoptedStylesheetPolyfill() {
  if (!('adoptedStyleSheets' in document)) {
    let sheets = [];
    Object.defineProperty(document, 'adoptedStyleSheets', {
      configurable: true,
      get() {
        return sheets;
      },
      set(value) {
        sheets = value;
      },
    });
  }

  if (
    typeof globalThis.CSSStyleSheet !== 'function' ||
    typeof globalThis.CSSStyleSheet.prototype.replaceSync !== 'function'
  ) {
    class TestCSSStyleSheet {
      constructor() {
        this.cssText = '';
      }

      replaceSync(text) {
        this.cssText = String(text);
      }
    }

    globalThis.CSSStyleSheet = TestCSSStyleSheet;
    global.CSSStyleSheet = TestCSSStyleSheet;
    window.CSSStyleSheet = TestCSSStyleSheet;
  }
}

installAdoptedStylesheetPolyfill();

const nativeFetch = globalThis.fetch.bind(globalThis);

async function fileAwareFetch(resource, init) {
  const target =
    resource instanceof URL ? resource : new URL(String(resource), 'https://dout.dev/');

  if (target.protocol === 'file:') {
    const body = await readFile(target, 'utf8');
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'text/css; charset=utf-8' },
    });
  }

  return nativeFetch(resource, init);
}

global.fetch = fileAwareFetch;
window.fetch = fileAwareFetch;

let BODY_FONT_OPTIONS,
  CODE_FONT_OPTIONS,
  DEFAULT_PREFERENCES,
  DisplayPreferencesPopover,
  FONT_SCALE_OPTIONS,
  HEADING_FONT_OPTIONS,
  RADIUS_PRESET_OPTIONS,
  STORAGE_KEY,
  applyPreferencesToDocument;

before(async () => {
  const mod = await import(
    new URL('./DisplayPreferencesPopover.js?component-test', import.meta.url)
  );
  ({
    BODY_FONT_OPTIONS,
    CODE_FONT_OPTIONS,
    DEFAULT_PREFERENCES,
    DisplayPreferencesPopover,
    FONT_SCALE_OPTIONS,
    HEADING_FONT_OPTIONS,
    RADIUS_PRESET_OPTIONS,
    STORAGE_KEY,
    applyPreferencesToDocument,
  } = mod);
});

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.adoptedStyleSheets = [];
  document.documentElement.removeAttribute('data-reduce-motion');
  document.documentElement.removeAttribute('data-reduce-animations');
  document.documentElement.removeAttribute('data-reduce-transparency');
  document.documentElement.removeAttribute('data-increase-contrast');
  document.documentElement.removeAttribute('data-radius-preset');
  document.documentElement.style.removeProperty('font-size');
  document.documentElement.style.removeProperty('--dout--font-display');
  document.documentElement.style.removeProperty('--dout--font-sans');
  document.documentElement.style.removeProperty('--dout--font-mono');
  window.localStorage.clear();
});

function mountPopover() {
  const element = document.createElement('display-preferences-popover');
  document.body.appendChild(element);
  return element;
}

describe('DisplayPreferencesPopover', () => {
  test('registers the custom element and renders the preference controls', () => {
    const element = mountPopover();

    assert.equal(customElements.get('display-preferences-popover'), DisplayPreferencesPopover);
    assert.deepEqual(FONT_SCALE_OPTIONS, ['75%', '80%', '90%', '100%', '110%', '120%', '125%']);
    assert.equal(element.querySelector('.preferences-toggle') !== null, true);
    assert.equal(element.querySelector('accent-color-selector') !== null, true);
    assert.equal(element.querySelectorAll('input[type="checkbox"]').length, 4);
    assert.equal(element.querySelectorAll('input[type="radio"][name="radiusPreset"]').length, 3);
    assert.equal(element.querySelectorAll('select').length, 4);
    assert.equal(element.querySelector('select[name="fontScale"]').value, '100%');
    assert.equal(
      element.querySelector('input[name="radiusPreset"][value="rounded"]').checked,
      true
    );
  });

  test('applies saved preferences when the component connects', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bodyFont: 'book-serif',
        codeFont: 'system-mono',
        fontScale: '125%',
        headingFont: 'system-sans',
        increaseContrast: true,
        radiusPreset: 'rounded',
        reduceAnimations: true,
        reduceMotion: true,
        reduceTransparency: true,
      })
    );

    const element = mountPopover();

    assert.equal(document.documentElement.getAttribute('data-reduce-motion'), 'true');
    assert.equal(document.documentElement.getAttribute('data-reduce-animations'), 'true');
    assert.equal(document.documentElement.getAttribute('data-reduce-transparency'), 'true');
    assert.equal(document.documentElement.getAttribute('data-increase-contrast'), 'true');
    assert.equal(document.documentElement.getAttribute('data-radius-preset'), 'rounded');
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
    assert.equal(element.querySelector('select[name="headingFont"]').value, 'system-sans');
    assert.equal(element.querySelector('select[name="bodyFont"]').value, 'book-serif');
    assert.equal(element.querySelector('select[name="codeFont"]').value, 'system-mono');
  });

  test('changing controls updates document preferences and storage', () => {
    const element = mountPopover();
    const reduceMotion = element.querySelector('input[name="reduceMotion"]');
    const fontScale = element.querySelector('select[name="fontScale"]');
    const radiusPreset = element.querySelector('input[name="radiusPreset"][value="squircle"]');
    const headingFont = element.querySelector('select[name="headingFont"]');
    const bodyFont = element.querySelector('select[name="bodyFont"]');
    const codeFont = element.querySelector('select[name="codeFont"]');

    reduceMotion.checked = true;
    reduceMotion.dispatchEvent(new window.Event('change', { bubbles: true }));

    fontScale.value = '80%';
    fontScale.dispatchEvent(new window.Event('change', { bubbles: true }));

    radiusPreset.dispatchEvent(new window.Event('change', { bubbles: true }));

    headingFont.value = 'rounded-sans';
    headingFont.dispatchEvent(new window.Event('change', { bubbles: true }));

    bodyFont.value = 'readable-serif';
    bodyFont.dispatchEvent(new window.Event('change', { bubbles: true }));

    codeFont.value = 'classic-mono';
    codeFont.dispatchEvent(new window.Event('change', { bubbles: true }));

    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    assert.equal(document.documentElement.getAttribute('data-reduce-motion'), 'true');
    assert.equal(document.documentElement.getAttribute('data-radius-preset'), 'squircle');
    assert.equal(document.documentElement.style.fontSize, '80%');
    assert.equal(saved.fontScale, '80%');
    assert.equal(saved.radiusPreset, 'squircle');
    assert.equal(saved.headingFont, 'rounded-sans');
    assert.equal(saved.bodyFont, 'readable-serif');
    assert.equal(saved.codeFont, 'classic-mono');
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-display'),
      /Optima/i
    );
    assert.match(document.documentElement.style.getPropertyValue('--dout--font-sans'), /Charter/i);
    assert.match(
      document.documentElement.style.getPropertyValue('--dout--font-mono'),
      /Courier New/i
    );
  });

  test('uses a click-driven fallback when the native popover API is unavailable', () => {
    const element = mountPopover();
    const toggle = element.querySelector('.preferences-toggle');

    toggle.click();

    assert.equal(element.dataset.open, 'true');
    assert.equal(element.querySelector('.preferences-panel').getAttribute('data-open'), 'true');
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');

    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));

    assert.equal(element.dataset.open, 'false');
    assert.equal(element.querySelector('.preferences-panel').getAttribute('data-open'), 'false');
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  });

  test('loads local component styles and registers them autonomously', async () => {
    mountPopover();

    const componentSource = await readFile(
      new URL('./DisplayPreferencesPopover.js', import.meta.url),
      'utf8'
    );
    const componentCss = await readFile(
      new URL('./DisplayPreferencesPopover.css', import.meta.url),
      'utf8'
    );

    assert.equal(document.adoptedStyleSheets.length, 2);
    assert.ok(
      document.adoptedStyleSheets[0].cssText.includes(
        'display-preferences-popover .preferences-toggle'
      ) ||
        document.adoptedStyleSheets[1].cssText.includes(
          'display-preferences-popover .preferences-toggle'
        )
    );
    assert.ok(
      componentSource.includes("import cssText from 'bundle-text:./DisplayPreferencesPopover.css';")
    );
    assert.ok(componentSource.includes('static {'));
    assert.ok(componentCss.includes('display-preferences-popover .preferences-panel'));
    assert.ok(!componentCss.includes(':host'));
  });

  test('exports sensible defaults and applies them directly to the document', () => {
    const applied = applyPreferencesToDocument(DEFAULT_PREFERENCES);

    assert.equal(applied.fontScale, '100%');
    assert.equal(applied.headingFont, HEADING_FONT_OPTIONS[0].id);
    assert.equal(applied.bodyFont, BODY_FONT_OPTIONS[0].id);
    assert.equal(applied.codeFont, CODE_FONT_OPTIONS[0].id);
    assert.equal(applied.radiusPreset, RADIUS_PRESET_OPTIONS[1].id);
  });
});
