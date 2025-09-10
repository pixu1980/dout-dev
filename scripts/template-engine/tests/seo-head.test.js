import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { JSDOM } from 'jsdom';

import { TemplateEngine } from '../index.js';

const engine = new TemplateEngine({ rootDir: process.cwd() });

const site = {
  analytics: { dashboardPath: '/privacy.html', endpoint: '' },
  author: 'Emiliano "pixu1980" Pisu',
  description: 'Vanilla-first static blog.',
  jsonFeedPath: '/feed.json',
  language: 'en',
  locale: 'en-US',
  rssFeedPath: '/feed.rss',
  security: {
    csp: "default-src 'self'",
    referrerPolicy: 'strict-origin-when-cross-origin',
  },
  title: 'dout.dev',
  url: 'https://dout.dev',
};

function renderDocument(templatePath, data) {
  const html = engine.render(templatePath, { site, ...data });
  return new JSDOM(html).window.document;
}

function assertSocialTagsStayInHead(document, selectors) {
  for (const selector of selectors) {
    assert.notEqual(
      document.head.querySelector(selector),
      null,
      `${selector} should render in <head>`
    );
    assert.equal(
      document.body.querySelector(selector),
      null,
      `${selector} should not render in <body>`
    );
  }
}

describe('TemplateEngine - SEO head rendering', () => {
  test('home template keeps OG and Twitter tags in head', () => {
    const document = renderDocument('src/templates/home.html', {
      canonicalUrl: 'https://dout.dev/',
      description: 'Latest field notes from dout.dev.',
      featuredPost: null,
      ogImageUrl: 'https://dout.dev/assets/og/pages/home.png',
      posts: [],
      stats: { posts: 0, series: 0, tags: 0 },
      title: 'dout.dev',
      topTags: [],
    });

    assertSocialTagsStayInHead(document, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'script[type="application/ld+json"]',
    ]);
  });

  test('tag template emits one canonical and keeps metadata in head', () => {
    const document = renderDocument('src/templates/tag.html', {
      canonicalUrl: 'https://dout.dev/tags/css.html',
      description: 'Posts tagged with CSS.',
      ogImageUrl: 'https://dout.dev/assets/og/tags/css.png',
      pagination: null,
      posts: [],
      tag: { name: 'CSS', slug: 'css' },
      title: 'CSS Posts',
    });

    assert.equal(document.head.querySelectorAll('link[rel="canonical"]').length, 1);
    assertSocialTagsStayInHead(document, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]);
  });

  test('post template emits article metadata in head', () => {
    const document = renderDocument('src/templates/post.html', {
      canonicalUrl: 'https://dout.dev/posts/example.html',
      description: 'Example article description.',
      ogImageUrl: 'https://dout.dev/assets/og/posts/example.png',
      post: {
        content: '<p>Example body</p>',
        coverAlt: 'Example cover',
        date: '2026-04-20T12:00:00.000Z',
        keywords: ['css', 'accessibility'],
        name: 'example',
        tags: [],
        title: 'Example Post',
        toc: [],
      },
      title: 'Example Post',
    });

    assertSocialTagsStayInHead(document, [
      'meta[property="og:image"]',
      'meta[property="article:published_time"]',
      'meta[name="twitter:image"]',
    ]);
  });
});
