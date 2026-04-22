import assert from 'node:assert/strict';
import { before, beforeEach, describe, test } from 'node:test';
import { JSDOM } from 'jsdom';

let decorateExternalLink;
let initExternalLinks;

function installDom(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'http://localhost:3000/posts/example.html',
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLAnchorElement = dom.window.HTMLAnchorElement;
}

before(async () => {
  ({ decorateExternalLink, initExternalLinks } = await import(
    new URL('./external-links.js', import.meta.url)
  ));
});

beforeEach(() => {
  installDom('');
});

describe('external-links', () => {
  test('decorates outbound links with target, referrer policy, and source param', () => {
    installDom(
      '<a href="https://example.com/docs?topic=css#intro" rel="author noreferrer">Docs</a>'
    );
    const anchor = document.querySelector('a');

    const changed = decorateExternalLink(anchor);

    assert.equal(changed, true);
    assert.equal(anchor.target, '_blank');
    assert.equal(anchor.getAttribute('referrerpolicy'), 'strict-origin-when-cross-origin');
    assert.equal(anchor.href, 'https://example.com/docs?topic=css&from=dout.dev#intro');
    assert.equal(anchor.rel, 'author noopener');
  });

  test('leaves internal links untouched', () => {
    installDom(
      '<a href="/archive.html">Archive</a><a href="https://dout.dev/about.html">About</a>'
    );
    const links = document.querySelectorAll('a');

    initExternalLinks();

    assert.equal(links[0].target, '');
    assert.equal(links[0].href, 'http://localhost:3000/archive.html');
    assert.equal(links[1].target, '');
    assert.equal(links[1].href, 'https://dout.dev/about.html');
  });
});
