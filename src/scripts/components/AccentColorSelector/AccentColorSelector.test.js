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

let ACCENT_OPTIONS, AccentColorSelector, STORAGE_KEY;

before(async () => {
  const mod = await import(new URL('./AccentColorSelector.js?component-test', import.meta.url));
  ({ ACCENT_OPTIONS, AccentColorSelector, STORAGE_KEY } = mod);
});

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.adoptedStyleSheets = [];
  document.documentElement.style.removeProperty('--accent-h');
  document.documentElement.style.removeProperty('--accent-s');
  document.documentElement.style.removeProperty('--accent-l');
  window.localStorage.clear();
});

function mountSelector() {
  const element = document.createElement('accent-color-selector');
  document.body.appendChild(element);
  return element;
}

describe('AccentColorSelector', () => {
  test('registers the custom element and exposes five accent options', () => {
    assert.equal(customElements.get('accent-color-selector'), AccentColorSelector);
    assert.equal(ACCENT_OPTIONS.length, 5);
  });

  test('renders buttons and applies the saved accent on connect', () => {
    window.localStorage.setItem(STORAGE_KEY, 'mint');

    const element = mountSelector();
    const activeButton = element.querySelector('[data-accent="mint"]');

    assert.equal(element.querySelectorAll('.accent-button').length, 5);
    assert.equal(activeButton.getAttribute('aria-checked'), 'true');
    assert.equal(activeButton.tabIndex, 0);
    assert.equal(document.documentElement.style.getPropertyValue('--accent-h'), '145');
    assert.equal(document.documentElement.style.getPropertyValue('--accent-s'), '80%');
    assert.equal(document.documentElement.style.getPropertyValue('--accent-l'), '60%');
  });

  test('clicking a button updates the root accent variables and emits an event', () => {
    const element = mountSelector();
    let emittedDetail = null;

    element.addEventListener('accent-changed', (event) => {
      emittedDetail = event.detail;
    });

    const roseButton = element.querySelector('[data-accent="rose"]');
    roseButton.click();

    assert.equal(window.localStorage.getItem(STORAGE_KEY), 'rose');
    assert.equal(document.documentElement.style.getPropertyValue('--accent-h'), '340');
    assert.equal(document.documentElement.style.getPropertyValue('--accent-s'), '90%');
    assert.equal(document.documentElement.style.getPropertyValue('--accent-l'), '62%');
    assert.deepEqual(emittedDetail, { accentId: 'rose', label: 'Rose' });
    assert.equal(roseButton.getAttribute('aria-checked'), 'true');
    assert.equal(
      element.querySelector('[data-accent="coral"]').getAttribute('aria-checked'),
      'false'
    );
  });

  test('supports radiogroup keyboard navigation', () => {
    const element = mountSelector();
    const coralButton = element.querySelector('[data-accent="coral"]');

    coralButton.dispatchEvent(
      new window.KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    );

    const roseButton = element.querySelector('[data-accent="rose"]');
    assert.equal(document.activeElement, roseButton);
    assert.equal(roseButton.getAttribute('aria-checked'), 'true');
    assert.equal(window.localStorage.getItem(STORAGE_KEY), 'rose');
  });

  test('loads local component styles and registers them autonomously', async () => {
    mountSelector();

    const componentSource = await readFile(
      new URL('./AccentColorSelector.js', import.meta.url),
      'utf8'
    );
    const componentCss = await readFile(
      new URL('./AccentColorSelector.css', import.meta.url),
      'utf8'
    );

    assert.equal(document.adoptedStyleSheets.length, 1);
    assert.ok(
      document.adoptedStyleSheets[0].cssText.includes('accent-color-selector .accent-selector')
    );
    assert.ok(
      componentSource.includes("import cssText from 'bundle-text:./AccentColorSelector.css';")
    );
    assert.ok(componentSource.includes('static {'));
    assert.ok(componentCss.includes('accent-color-selector .accent-selector'));
    assert.ok(!componentCss.includes(':host'));
  });
});
