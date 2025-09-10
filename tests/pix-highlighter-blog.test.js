import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { before, beforeEach, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const SRC_ROOT = join(PROJECT_ROOT, 'src');
const FIXTURE_PAGE = join(SRC_ROOT, 'posts', '2024-12-27-m4-template-test.html');
const EXCLUDED_SEGMENTS = new Set(['components', 'layouts', 'templates']);

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
global.MutationObserver = dom.window.MutationObserver;
global.CustomEvent = dom.window.CustomEvent;
global.customElements = dom.window.customElements;

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

function resetDomWithHtml(html, urlPath) {
  const pageDom = new JSDOM(html, { url: `https://dout.dev/${urlPath}` });
  document.documentElement.lang = pageDom.window.document.documentElement.lang || 'en';
  document.head.innerHTML = pageDom.window.document.head.innerHTML;
  document.body.innerHTML = pageDom.window.document.body.innerHTML;
  document.documentElement.removeAttribute('data-pix-highlighter-theme');
  window.localStorage.clear();
}

async function collectHtmlFiles(directory, files = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_SEGMENTS.has(entry.name)) {
        continue;
      }

      await collectHtmlFiles(entryPath, files);
      continue;
    }

    if (entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }

  return files;
}

function resetPixHighlighterState(PixHighlighter) {
  for (const instance of Array.from(PixHighlighter.instances)) {
    instance.disconnectedCallback?.();
  }

  PixHighlighter.instances.clear();
  PixHighlighter._uid = 0;
  PixHighlighter._themeInitialized = false;
  PixHighlighter.clearManagedHighlights();
}

let PixHighlighter, enhancePixHighlighters;

before(async () => {
  enableHighlightSupport();
  const mod = await import(
    new URL('../src/scripts/components/PixHighlighter/PixHighlighter.js', import.meta.url)
  );
  ({ PixHighlighter, enhancePixHighlighters } = mod);
});

beforeEach(() => {
  enableHighlightSupport();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-pix-highlighter-theme');
  window.localStorage.clear();
  resetPixHighlighterState(PixHighlighter);
});

describe('PixHighlighter blog integration', () => {
  test('enhances every blog page code block with controls and themes', async () => {
    const htmlFiles = await collectHtmlFiles(SRC_ROOT);

    let pagesWithHighlighters = 0;

    for (const htmlFile of htmlFiles) {
      const html = await readFile(htmlFile, 'utf8');
      const urlPath = relative(SRC_ROOT, htmlFile).replaceAll('\\', '/');
      resetDomWithHtml(html, urlPath);
      resetPixHighlighterState(PixHighlighter);

      const blocks = Array.from(document.querySelectorAll("pre[is='pix-highlighter']"));
      if (!blocks.length) continue;

      pagesWithHighlighters += 1;
      enhancePixHighlighters(document);

      for (const block of blocks) {
        assert.ok(block.querySelector('[data-pix-highlighter-toolbar]'), urlPath);
        assert.ok(block.querySelector('details[data-pix-highlighter-theme-picker]'), urlPath);
        assert.equal(
          block.querySelectorAll('button[data-pix-highlighter-theme-option]').length,
          5,
          urlPath
        );
        assert.ok(block.querySelector('button[data-pix-highlighter-copy] svg'), urlPath);
      }
    }

    assert.ok(pagesWithHighlighters > 0);
  });

  test('renders fallback token markup on real blog content without CSS.highlights', async () => {
    const html = await readFile(FIXTURE_PAGE, 'utf8');
    resetDomWithHtml(html, 'posts/2024-12-27-m4-template-test.html');
    disableHighlightSupport();
    resetPixHighlighterState(PixHighlighter);

    enhancePixHighlighters(document);

    const javascriptPre = document.querySelector(
      "pre[is='pix-highlighter'][data-lang='javascript'], pre[is='pix-highlighter'][lang='javascript']"
    );
    const javascriptBlock = javascriptPre.querySelector('code');
    assert.ok(javascriptBlock.querySelector('.pix-token--kw'));
    assert.ok(javascriptBlock.querySelector('.pix-token--str'));
    assert.ok(javascriptPre.querySelector('button[data-pix-highlighter-copy] svg'));
    assert.equal(
      javascriptPre.querySelectorAll('button[data-pix-highlighter-theme-option]').length,
      5
    );
  });

  test('collects shared highlights on real blog content when the API is available', async () => {
    const html = await readFile(FIXTURE_PAGE, 'utf8');
    resetDomWithHtml(html, 'posts/2024-12-27-m4-template-test.html');
    enableHighlightSupport();
    resetPixHighlighterState(PixHighlighter);

    enhancePixHighlighters(document);

    assert.ok(globalThis.CSS.highlights.has('pix-kw'));
    assert.ok(globalThis.CSS.highlights.has('pix-str'));
    assert.ok(globalThis.CSS.highlights.get('pix-kw').ranges.length > 0);
  });
});
