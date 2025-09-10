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

if (typeof window.requestAnimationFrame !== 'function') {
  window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  window.cancelAnimationFrame = (handle) => clearTimeout(handle);
}

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

let DEFAULT_LAYOUT, LAYOUTS, PostFeedLayoutSelector, STORAGE_KEY;

before(async () => {
  const componentModule = await import(
    new URL('./PostFeedLayoutSelector.js?component-test', import.meta.url)
  );
  const layoutModule = await import(new URL('../../post-feed-layout.js', import.meta.url));

  ({ DEFAULT_LAYOUT, LAYOUTS, PostFeedLayoutSelector } = componentModule);
  ({ STORAGE_KEY } = layoutModule);
});

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.adoptedStyleSheets = [];
  document.documentElement.removeAttribute('data-post-feed-layout');
  window.localStorage.clear();
});

function mountSelector() {
  const element = document.createElement('post-feed-layout-selector');
  document.body.appendChild(element);
  return element;
}

describe('PostFeedLayoutSelector', () => {
  test('registers the custom element and renders two layout buttons', () => {
    const element = mountSelector();

    assert.equal(customElements.get('post-feed-layout-selector'), PostFeedLayoutSelector);
    assert.deepEqual(LAYOUTS, ['list', 'grid']);
    assert.equal(element.querySelectorAll('.post-feed-layout__button').length, 2);
    assert.equal(document.documentElement.dataset.postFeedLayout, DEFAULT_LAYOUT);
  });

  test('falls back to the default layout when the saved value is no longer supported', () => {
    window.localStorage.setItem(STORAGE_KEY, 'masonry');

    const element = mountSelector();
    const listButton = element.querySelector('[data-layout="list"]');

    assert.equal(document.documentElement.dataset.postFeedLayout, DEFAULT_LAYOUT);
    assert.equal(listButton.getAttribute('aria-pressed'), 'true');
  });

  test('clicking a button updates the document dataset and storage', () => {
    const element = mountSelector();
    const gridButton = element.querySelector('[data-layout="grid"]');

    gridButton.click();

    assert.equal(document.documentElement.dataset.postFeedLayout, 'grid');
    assert.equal(window.localStorage.getItem(STORAGE_KEY), 'grid');
    assert.equal(gridButton.getAttribute('aria-pressed'), 'true');
    assert.equal(
      element.querySelector('[data-layout="list"]').getAttribute('aria-pressed'),
      'false'
    );
  });

  test('loads local component styles and registers them autonomously', async () => {
    mountSelector();

    const componentSource = await readFile(
      new URL('./PostFeedLayoutSelector.js', import.meta.url),
      'utf8'
    );
    const componentCss = await readFile(
      new URL('./PostFeedLayoutSelector.css', import.meta.url),
      'utf8'
    );

    assert.equal(document.adoptedStyleSheets.length, 1);
    assert.ok(
      document.adoptedStyleSheets[0].cssText.includes(
        'post-feed-layout-selector .post-feed-layout__button'
      )
    );
    assert.ok(
      componentSource.includes("import cssText from 'bundle-text:./PostFeedLayoutSelector.css';")
    );
    assert.ok(componentCss.includes('post-feed-layout-selector .post-feed-layout__group'));
  });
});
