import assert from 'node:assert/strict';
import { before, beforeEach, describe, test } from 'node:test';
import { JSDOM } from 'jsdom';

let destroyArticleNavigation, initArticleNavigation;

function installDom(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'https://dout.dev/posts/example.html',
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLAnchorElement = dom.window.HTMLAnchorElement;
}

before(async () => {
  ({ destroyArticleNavigation, initArticleNavigation } = await import(
    new URL('./article-navigation.js', import.meta.url)
  ));
});

beforeEach(() => {
  destroyArticleNavigation?.();
  installDom('');
});

describe('article-navigation', () => {
  test('syncs the active TOC link from data-attribute markup', () => {
    installDom(`
      <div data-preferences-skeleton>
        <nav data-post-toc><a data-post-toc-link href="#ghost">Ghost</a></nav>
      </div>
      <main data-site-main>
        <section data-prose>
          <h2 id="intro" data-toc-anchor="true">Intro</h2>
          <h2 id="details" data-toc-anchor="true">Details</h2>
        </section>
        <nav data-post-toc>
          <ol data-post-toc-list>
            <li data-post-toc-item><a data-post-toc-link href="#intro">Intro</a></li>
            <li data-post-toc-item><a data-post-toc-link href="#details">Details</a></li>
          </ol>
        </nav>
      </main>
    `);

    document.getElementById('intro').getBoundingClientRect = () => ({ top: 40 });
    document.getElementById('details').getBoundingClientRect = () => ({ top: 900 });

    initArticleNavigation();

    assert.equal(
      document.querySelector('main [href="#intro"]')?.getAttribute('aria-current'),
      'location'
    );
    assert.equal(
      document.querySelector('[data-preferences-skeleton] a')?.hasAttribute('aria-current'),
      false
    );
  });

  test('syncs active TOC link at the heading scroll-margin offset', () => {
    installDom(`
      <main data-site-main>
        <section data-prose>
          <h2 id="intro" data-toc-anchor="true">Intro</h2>
          <h2 id="details" data-toc-anchor="true">Details</h2>
        </section>
        <nav data-post-toc>
          <ol data-post-toc-list>
            <li data-post-toc-item><a data-post-toc-link href="#intro">Intro</a></li>
            <li data-post-toc-item><a data-post-toc-link href="#details">Details</a></li>
          </ol>
        </nav>
      </main>
    `);

    const intro = document.getElementById('intro');
    const details = document.getElementById('details');
    const originalGetComputedStyle = window.getComputedStyle;

    window.getComputedStyle = (element) => ({
      ...originalGetComputedStyle.call(window, element),
      scrollMarginTop: '128px',
    });
    intro.getBoundingClientRect = () => ({ top: -320 });
    details.getBoundingClientRect = () => ({ top: 150 });

    initArticleNavigation();

    assert.equal(
      document.querySelector('main [href="#intro"]')?.getAttribute('aria-current'),
      'location'
    );
    assert.equal(
      document.querySelector('main [href="#details"]')?.hasAttribute('aria-current'),
      false
    );

    details.getBoundingClientRect = () => ({ top: 128 });
    window.dispatchEvent(new window.Event('scroll'));

    assert.equal(
      document.querySelector('main [href="#details"]')?.getAttribute('aria-current'),
      'location'
    );
  });
});
