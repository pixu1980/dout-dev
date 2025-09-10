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

let ColorSchemeSelector, SCHEMES, STORAGE_KEY;

before(async () => {
  const mod = await import(new URL('./ColorSchemeSelector.js?component-test', import.meta.url));
  ({ ColorSchemeSelector, SCHEMES, STORAGE_KEY } = mod);
});

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.adoptedStyleSheets = [];
  document.documentElement.removeAttribute('data-color-scheme');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  window.localStorage.clear();
});

function mountSelector(tagName = 'color-scheme-switcher') {
  const element = document.createElement(tagName);
  document.body.appendChild(element);
  return element;
}

describe('ColorSchemeSelector', () => {
  test('registers only the switcher tag', () => {
    assert.equal(customElements.get('color-scheme-switcher'), ColorSchemeSelector);
    assert.equal(customElements.get('color-scheme-selector'), undefined);
    assert.deepEqual(SCHEMES, ['light', 'dark', 'system']);
  });

  test('renders three options and applies a saved explicit scheme', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark');

    const element = mountSelector();
    const darkInput = element.querySelector('input[value="dark"]');

    assert.equal(element.querySelectorAll('input[name="color-scheme"]').length, 3);
    assert.equal(darkInput.checked, true);
    assert.equal(document.documentElement.dataset.colorScheme, 'dark');
    assert.equal(document.documentElement.style.colorScheme, 'dark');
    assert.equal(
      document.querySelector('meta[name="color-scheme"]')?.getAttribute('content'),
      'dark'
    );
  });

  test('switching back to system clears the explicit dataset', () => {
    const element = mountSelector();
    const darkInput = element.querySelector('input[value="dark"]');
    const systemInput = element.querySelector('input[value="system"]');

    darkInput.checked = true;
    darkInput.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(document.documentElement.dataset.colorScheme, 'dark');
    assert.equal(window.localStorage.getItem(STORAGE_KEY), 'dark');

    systemInput.checked = true;
    systemInput.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(document.documentElement.hasAttribute('data-color-scheme'), false);
    assert.equal(document.documentElement.style.colorScheme, 'light dark');
    assert.equal(window.localStorage.getItem(STORAGE_KEY), 'system');
    assert.equal(
      document.querySelector('meta[name="color-scheme"]')?.getAttribute('content'),
      'light dark'
    );
  });

  test('loads local component styles and registers them autonomously', async () => {
    mountSelector();

    const componentSource = await readFile(
      new URL('./ColorSchemeSelector.js', import.meta.url),
      'utf8'
    );
    const componentCss = await readFile(
      new URL('./ColorSchemeSelector.css', import.meta.url),
      'utf8'
    );

    assert.equal(document.adoptedStyleSheets.length, 1);
    assert.ok(
      document.adoptedStyleSheets[0].cssText.includes(
        'color-scheme-switcher .color-scheme-selector'
      )
    );
    assert.ok(
      componentSource.includes("import cssText from 'bundle-text:./ColorSchemeSelector.css';")
    );
    assert.ok(componentSource.includes('static {'));
    assert.ok(!componentSource.includes('ColorSchemeSelectorAlias'));
    assert.ok(componentCss.includes('color-scheme-switcher .color-scheme-selector'));
    assert.ok(!componentCss.includes(':host'));
  });
});
