import assert from 'node:assert/strict';
import { before, beforeEach, describe, test } from 'node:test';
import { JSDOM } from 'jsdom';

let initPostFeedLoadMore;

function installDom(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://dout.dev/',
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Document = dom.window.Document;
  global.CustomEvent = dom.window.CustomEvent;

  if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(0), 0);
  }

  if (typeof window.cancelAnimationFrame !== 'function') {
    window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
  }
}

function buildFeedMarkup(count, { initial = 10, step = 10 } = {}) {
  const items = Array.from(
    { length: count },
    (_, index) => `<li data-post-feed-item>Post ${index + 1}</li>`
  ).join('');

  return `
    <section>
      <ul
        class="post-feed"
        data-post-feed
        data-load-more-feed="true"
        data-load-more-initial="${initial}"
        data-load-more-step="${step}"
        data-load-more-label="Load ${step} more posts"
      >
        ${items}
      </ul>
    </section>
  `;
}

function getVisibleItems() {
  return Array.from(document.querySelectorAll('[data-post-feed-item]')).filter(
    (item) => !item.hidden
  );
}

before(async () => {
  ({ initPostFeedLoadMore } = await import(new URL('./post-feed-load-more.js', import.meta.url)));
});

beforeEach(() => {
  installDom('');
});

describe('post-feed-load-more', () => {
  test('reveals posts in fixed batches until the feed is exhausted', () => {
    installDom(buildFeedMarkup(25));

    initPostFeedLoadMore();

    const button = document.querySelector('button.button--ghost');
    const status = document.querySelector('[data-post-feed-status]');

    assert.equal(getVisibleItems().length, 10);
    assert.equal(status?.textContent, 'Showing 10 of 25 posts');

    button?.click();
    assert.equal(getVisibleItems().length, 20);
    assert.equal(status?.textContent, 'Showing 20 of 25 posts');

    button?.click();
    assert.equal(getVisibleItems().length, 25);
    assert.equal(status?.textContent, 'Showing 25 of 25 posts');
    assert.equal(button?.hidden, true);
  });

  test('skips control creation when the feed already fits the initial batch', () => {
    installDom(buildFeedMarkup(8));

    initPostFeedLoadMore();

    assert.equal(getVisibleItems().length, 8);
    assert.equal(document.querySelector('[data-post-feed-actions]'), null);
  });
});
