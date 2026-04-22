import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
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
global.HTMLPreElement = dom.window.HTMLPreElement;
global.Node = dom.window.Node;
global.MutationObserver = dom.window.MutationObserver;
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

class TestHighlight {
  constructor() {
    this.ranges = [];
  }

  add(range) {
    this.ranges.push(range);
  }
}

function enableHighlightSupport() {
  const registry = new Map();
  globalThis.CSS = { highlights: registry };
  global.CSS = globalThis.CSS;
  window.CSS = globalThis.CSS;
  window.Highlight = TestHighlight;
  global.Highlight = TestHighlight;
}

function disableHighlightSupport() {
  globalThis.CSS = undefined;
  global.CSS = undefined;
  window.CSS = undefined;
  window.Highlight = undefined;
  global.Highlight = undefined;
}

let clipboardText = '';

function stubClipboard() {
  clipboardText = '';
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (value) => {
        clipboardText = value;
      },
    },
  });
}

let PixHighlighter,
  PIX_HIGHLIGHTER_THEME_OPTIONS,
  enhancePixHighlighters,
  normalizeLang,
  lexJS,
  lexTS,
  lexCSS,
  lexJSON,
  lexHTML,
  lexPython,
  lexRust,
  lexC,
  lexCPP,
  lexPHP,
  lexCSharp,
  lexGo,
  lexMarkdown,
  lexYAML,
  lexBash;

before(async () => {
  enableHighlightSupport();
  stubClipboard();
  const mod = await import(new URL('./PixHighlighter.js', import.meta.url));
  ({
    PixHighlighter,
    PIX_HIGHLIGHTER_THEME_OPTIONS,
    enhancePixHighlighters,
    normalizeLang,
    lexJS,
    lexTS,
    lexCSS,
    lexJSON,
    lexHTML,
    lexPython,
    lexRust,
    lexC,
    lexCPP,
    lexPHP,
    lexCSharp,
    lexGo,
    lexMarkdown,
    lexYAML,
    lexBash,
  } = mod);
});

beforeEach(() => {
  for (const instance of Array.from(PixHighlighter?.instances ?? [])) {
    instance.disconnectedCallback();
    instance.remove();
  }

  enableHighlightSupport();
  stubClipboard();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  document.adoptedStyleSheets = [];
  document.querySelector('[data-pix-highlighter-styles]')?.remove();
  delete document.documentElement.dataset.pixHighlighterTheme;
  window.localStorage.clear();
  PixHighlighter._uid = 0;
  PixHighlighter._themeInitialized = false;
  PixHighlighter.instances.clear();
  PixHighlighter.clearManagedHighlights();
});

function createPseudoInstance({ code = 'const answer = 42;', lang = 'js' } = {}) {
  const host = document.createElement('pre');
  host.setAttribute('is', 'pix-highlighter');
  const codeElement = document.createElement('code');
  codeElement.textContent = code;
  host.appendChild(codeElement);
  host.setAttribute('lang', lang);
  document.body.appendChild(host);
  enhancePixHighlighters(document);
  return host;
}

function ensureTokens(lexer, code) {
  const tokens = lexer(code);
  assert.ok(tokens.length > 0, 'expected some tokens');

  for (const token of tokens.slice(0, 10)) {
    assert.equal(typeof token.type, 'string');
    assert.ok(Number.isInteger(token.start));
    assert.ok(Number.isInteger(token.end));
    assert.ok(token.end >= token.start);
  }
}

describe('PixHighlighter', () => {
  test('maps language aliases used in content', () => {
    assert.equal(normalizeLang('javascript'), 'js');
    assert.equal(normalizeLang('JS'), 'js');
    assert.equal(normalizeLang('yaml'), 'yml');
    assert.equal(normalizeLang('shell'), 'bash');
    assert.equal(normalizeLang('scss'), 'css');
    assert.equal(normalizeLang('zsh'), 'bash');
    assert.equal(normalizeLang(''), 'js');
  });

  test('registers shared highlight names and reinstalls component styles', () => {
    createPseudoInstance({ code: 'const answer = 42; // comment', lang: 'js' });

    assert.equal(document.adoptedStyleSheets.length, 1);
    assert.ok(globalThis.CSS.highlights.has('pix-kw'));
    assert.ok(globalThis.CSS.highlights.has('pix-num'));
    assert.ok(globalThis.CSS.highlights.has('pix-com'));
    assert.equal(globalThis.CSS.highlights.get('pix-kw').ranges.length, 1);
  });

  test('re-highlights when the language changes with the same source text', () => {
    const instance = createPseudoInstance({
      code: 'interface Box { value: string }',
      lang: 'js',
    });
    const previousTokens = instance._tokens.map((token) => ({ ...token }));

    instance.setAttribute('lang', 'ts');
    instance.attributeChangedCallback('lang', 'js', 'ts');

    assert.equal(instance._lastLang, 'ts');
    assert.notDeepEqual(instance._tokens, previousTokens);
  });

  test('keeps theme selection centralized across instances', () => {
    const first = createPseudoInstance({ code: 'const first = true;', lang: 'js' });
    const second = createPseudoInstance({ code: '<div>hi</div>', lang: 'html' });

    const firstPrismOption = first.querySelector(
      'button[data-pix-highlighter-theme-option="prism"]'
    );
    const firstThemeValue = first.querySelector('[data-pix-highlighter-theme-value]');
    const secondThemeValue = second.querySelector('[data-pix-highlighter-theme-value]');

    assert.equal(firstThemeValue.textContent, 'Default');
    assert.equal(secondThemeValue.textContent, 'Default');
    assert.equal(PIX_HIGHLIGHTER_THEME_OPTIONS.length, 5);

    firstPrismOption.click();

    assert.equal(document.documentElement.dataset.pixHighlighterTheme, 'prism');
    assert.equal(window.localStorage.getItem('pix-highlighter-theme'), 'prism');
    assert.equal(secondThemeValue.textContent, 'Prism');
  });

  test('copies the current code block content', async () => {
    const instance = createPseudoInstance({ code: 'const copied = true;', lang: 'js' });
    const copyButton = instance.querySelector('button[data-pix-highlighter-copy]');

    copyButton.click();
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(clipboardText, 'const copied = true;');
    assert.equal(copyButton.dataset.copyState, 'copied');
    assert.ok(copyButton.querySelector('svg'));
  });

  test('renders token spans when the highlight API is unavailable', () => {
    disableHighlightSupport();

    const instance = createPseudoInstance({ code: 'const plain = true;', lang: 'js' });

    assert.ok(instance.querySelector('.pix-token--kw'));
    assert.equal(document.adoptedStyleSheets.length, 1);
  });

  test('renders a custom theme picker and icon-only copy button', () => {
    const instance = createPseudoInstance({ code: 'const themed = true;', lang: 'js' });

    assert.ok(instance.querySelector('details[data-pix-highlighter-theme-picker]'));
    assert.equal(instance.querySelectorAll('button[data-pix-highlighter-theme-option]').length, 5);
    assert.ok(instance.querySelector('button[data-pix-highlighter-copy] svg'));
  });

  test('uses a fixed-position fallback when anchor positioning is unavailable', () => {
    const instance = createPseudoInstance({ code: 'const themed = true;', lang: 'js' });
    const themePicker = instance.querySelector('details[data-pix-highlighter-theme-picker]');
    const themeTrigger = instance.querySelector('summary[data-pix-highlighter-theme-trigger]');
    const themeList = instance.querySelector('[data-pix-highlighter-theme-list]');

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 768,
    });

    themeTrigger.getBoundingClientRect = () => ({
      left: 48,
      top: 60,
      right: 180,
      bottom: 96,
      width: 132,
      height: 36,
    });
    themeList.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 240,
      bottom: 220,
      width: 240,
      height: 220,
    });

    themePicker.open = true;
    themePicker.dispatchEvent(new dom.window.Event('toggle'));

    assert.equal(themeTrigger.getAttribute('aria-expanded'), 'true');
    assert.match(
      themeTrigger.style.getPropertyValue('anchor-name'),
      /^--dout--pix-highlighter-theme-trigger-/
    );
    assert.equal(
      themeList.style.getPropertyValue('position-anchor'),
      themeTrigger.style.getPropertyValue('anchor-name')
    );
    assert.equal(themeList.style.left, '48px');
    assert.equal(themeList.style.top, '104px');
    assert.equal(themeList.style.minWidth, '240px');

    themePicker.open = false;
    themePicker.dispatchEvent(new dom.window.Event('toggle'));

    assert.equal(themeTrigger.getAttribute('aria-expanded'), 'false');
    assert.equal(themeList.style.top, '');
  });

  test('falls back to a managed style element when adopted stylesheets are unavailable', () => {
    const adoptedStyleSheetsDescriptor = Object.getOwnPropertyDescriptor(
      document,
      'adoptedStyleSheets'
    );

    delete document.adoptedStyleSheets;

    try {
      const result = PixHighlighter.ensureComponentStyles();
      const style = document.head.querySelector('style[data-pix-highlighter-styles]');

      assert.equal(result, style);
      assert.ok(style);
      assert.match(style.textContent, /pix-highlighter/);
    } finally {
      Object.defineProperty(document, 'adoptedStyleSheets', adoptedStyleSheetsDescriptor);
    }
  });

  test('keeps enhancing code blocks when customized built-ins are unavailable', async () => {
    const originalCustomElements = globalThis.customElements;
    const originalWindowCustomElements = window.customElements;
    const registry = new Map();
    const fallbackCustomElements = {
      define() {
        throw new Error('Customized built-ins are not supported');
      },
      get(name) {
        return registry.get(name);
      },
    };

    Object.defineProperty(globalThis, 'customElements', {
      configurable: true,
      value: fallbackCustomElements,
    });
    Object.defineProperty(window, 'customElements', {
      configurable: true,
      value: fallbackCustomElements,
    });

    try {
      document.body.innerHTML =
        '<pre is="pix-highlighter" data-lang="js"><code>const fallback = true;</code></pre>';

      await import(new URL(`./PixHighlighter.js?fallback=${Date.now()}`, import.meta.url));
      await Promise.resolve();
      await Promise.resolve();

      const instance = document.querySelector("pre[is='pix-highlighter']");

      assert.ok(instance?.querySelector('[data-pix-highlighter-toolbar]'));
      assert.equal(
        instance?.querySelector('[data-pix-highlighter-theme-value]')?.textContent,
        'Default'
      );
    } finally {
      Object.defineProperty(globalThis, 'customElements', {
        configurable: true,
        value: originalCustomElements,
      });
      Object.defineProperty(window, 'customElements', {
        configurable: true,
        value: originalWindowCustomElements,
      });
    }
  });

  test('loads component-owned CSS bundles through static registration', async () => {
    const [
      componentSource,
      mainCss,
      themeDefaultsCss,
      prismCss,
      prettyLightsCss,
      darculaCss,
      cyberpunkCss,
    ] = await Promise.all([
      readFile(new URL('./PixHighlighter.js', import.meta.url), 'utf8'),
      readFile(new URL('./PixHighlighter.css', import.meta.url), 'utf8'),
      readFile(new URL('./Themes/theme-defaults.css', import.meta.url), 'utf8'),
      readFile(new URL('./Themes/prism.css', import.meta.url), 'utf8'),
      readFile(new URL('./Themes/prettylights.css', import.meta.url), 'utf8'),
      readFile(new URL('./Themes/darcula.css', import.meta.url), 'utf8'),
      readFile(new URL('./Themes/cyberpunk.css', import.meta.url), 'utf8'),
    ]);

    assert.ok(
      componentSource.includes("import mainCssText from 'bundle-text:./PixHighlighter.css';")
    );
    assert.ok(
      componentSource.includes("import prismThemeCssText from 'bundle-text:./Themes/prism.css';")
    );
    assert.ok(componentSource.includes('static {'));
    assert.ok(
      componentSource.includes("registry.define('pix-highlighter', this, { extends: 'pre' });")
    );
    assert.ok(mainCss.includes('::highlight(pix-kw)'));
    assert.ok(!mainCss.includes('@import'));
    assert.ok(themeDefaultsCss.includes('[data-pix-highlighter-toolbar]'));
    assert.ok(themeDefaultsCss.includes('position-anchor'));
    assert.ok(themeDefaultsCss.includes('anchor(bottom)'));
    assert.ok(prismCss.includes("[data-pix-highlighter-theme='prism']"));
    assert.ok(prettyLightsCss.includes("[data-pix-highlighter-theme='prettylights']"));
    assert.ok(darculaCss.includes("[data-pix-highlighter-theme='darcula']"));
    assert.ok(cyberpunkCss.includes("[data-pix-highlighter-theme='cyberpunk']"));
  });

  test('keeps lexer coverage across supported languages', () => {
    ensureTokens(lexJS, 'const x = 42; // comment');
    ensureTokens(lexTS, 'interface Box { value: number }');
    ensureTokens(lexCSS, 'body { color: red; }');
    ensureTokens(lexHTML, '<div class="x">Hi</div>');
    ensureTokens(lexJSON, '{"a":1,"b":[true,false,null]}');
    ensureTokens(lexMarkdown, '# Title\n\nSome **bold** `code`');
    ensureTokens(lexBash, 'echo "hello" && ls -la');
    ensureTokens(lexPython, 'def f(x):\n    return x + 1');
    ensureTokens(lexGo, 'package main\nfunc main(){println("hi")}');
    ensureTokens(lexRust, 'fn main(){ let x: i32 = 5; }');
    ensureTokens(lexC, 'int main(){ return 0; }');
    ensureTokens(lexCPP, 'int main(){ std::string s; }');
    ensureTokens(lexPHP, '<?php echo $x + 1; // comment');
    ensureTokens(lexCSharp, 'class X { int Y => 1; }');
    ensureTokens(lexYAML, 'a: 1\nlist:\n  - item');
  });
});
