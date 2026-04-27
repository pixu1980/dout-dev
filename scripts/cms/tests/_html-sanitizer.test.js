import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sanitizeArticleHtml } from '../_html-sanitizer.js';

test('sanitizeArticleHtml removes scripts and event handlers', () => {
  const html = sanitizeArticleHtml(
    '<p onclick="alert(1)">Hello</p><script>alert(1)</script><a href="javascript:alert(1)">Bad</a>'
  );

  assert.equal(html.includes('<script'), false);
  assert.equal(html.includes('onclick='), false);
  assert.equal(html.includes('javascript:'), false);
  assert.match(html, /<p>Hello<\/p>/);
});

test('sanitizeArticleHtml preserves trusted CodePen embeds and adds sandboxing', () => {
  const html = sanitizeArticleHtml(
    '<iframe src="https://codepen.io/pixu1980/embed/LYOJpBz" title="CodePen demo"></iframe>'
  );

  assert.match(html, /sandbox="allow-popups allow-same-origin allow-scripts"/);
  assert.match(html, /class="embed-frame embed-frame--codepen"/);
  assert.match(html, /referrerpolicy="no-referrer"/);
});

test('sanitizeArticleHtml removes untrusted iframes', () => {
  const html = sanitizeArticleHtml('<iframe src="https://evil.example/embed/demo"></iframe>');

  assert.equal(html.trim(), '');
});

test('sanitizeArticleHtml decorates outbound links for a new tab with source tracking', () => {
  const html = sanitizeArticleHtml(
    '<p><a href="https://example.com/docs?topic=css#intro" rel="author noreferrer">Read docs</a></p>'
  );

  assert.match(html, /href="https:\/\/example\.com\/docs\?topic=css&amp;from=dout\.dev#intro"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /referrerpolicy="strict-origin-when-cross-origin"/);
  assert.match(html, /rel="author noopener"|rel="noopener author"/);
  assert.doesNotMatch(html, /noreferrer/);
});
