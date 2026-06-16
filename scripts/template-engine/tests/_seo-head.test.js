import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
      featuredPosts: [],
      loadMore: null,
      ogImageUrl: 'https://dout.dev/assets/og/pages/home.png',
      posts: [],
      stats: { posts: 0, series: 0, tags: 0 },
      title: 'dout.dev',
      topTags: [{ name: 'CSS', slug: 'css' }],
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
      loadMore: null,
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
      seriesNavigation: [],
      title: 'Example Post',
    });

    assertSocialTagsStayInHead(document, [
      'meta[property="og:image"]',
      'meta[property="article:published_time"]',
      'meta[name="twitter:image"]',
    ]);
  });

  test('post template renders one series navigation below article comments', () => {
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
        toc: [{ id: 'intro', level: 2, text: 'Intro' }],
      },
      seriesNavigation: [
        {
          slug: 'how-i-made-it',
          title: 'How I made it',
          posts: [
            {
              current: true,
              label: 'Example Post (you are here)',
              title: 'Example Post',
              url: '/posts/example.html',
            },
          ],
        },
      ],
      site: {
        ...site,
        giscus: {
          category: 'General',
          categoryId: 'DIC_kwDOExample',
          emitMetadata: '0',
          enabled: true,
          inputPosition: 'bottom',
          lang: 'en',
          loading: 'lazy',
          mapping: 'specific',
          reactionsEnabled: '1',
          repo: 'owner/repo',
          repoId: 'R_kgDOExample',
          strict: '1',
          theme: 'preferred_color_scheme',
        },
      },
      title: 'Example Post',
    });

    assert.equal(document.querySelectorAll('[data-series-navigation]').length, 1);
    assert.notEqual(
      document.querySelector('[data-comments-shell] + [data-series-navigation]'),
      null
    );
    assert.equal(document.querySelector('[data-post-sidebar] [data-series-navigation]'), null);
  });

  test('home template places stats inside the hero copy and uses updated labels', () => {
    const document = renderDocument('src/templates/home.html', {
      canonicalUrl: 'https://dout.dev/',
      description: 'Latest field notes from dout.dev.',
      featuredPost: null,
      featuredPosts: [
        {
          date: '2026-04-20T12:00:00.000Z',
          excerpt: 'Featured article excerpt.',
          name: 'example-post',
          title: 'Example Post',
        },
      ],
      loadMore: null,
      ogImageUrl: 'https://dout.dev/assets/og/pages/home.png',
      posts: [],
      stats: { featured: 1, latest: 3, months: 2, posts: 3, series: 1, tags: 2 },
      title: 'dout.dev',
      topTags: [{ name: 'CSS', slug: 'css' }],
    });

    assert.notEqual(document.querySelector('[data-hero-copy] > [data-hero-stats]'), null);
    assert.equal(
      document.querySelector('[data-hero][data-hero-variant="home"] + [data-hero-stats]'),
      null
    );
    assert.equal(document.querySelector('[data-hero-panel] [data-hero-stats]'), null);
    assert.equal(
      document.querySelector('[data-hero-copy] > [data-eyebrow]')?.textContent.trim(),
      'Editorial notes and stats'
    );
    assert.equal(
      document.querySelector('[data-hero-panel] [data-eyebrow]')?.textContent.trim(),
      'Featured'
    );
    assert.equal(
      document.querySelector('#latest-title')?.textContent.trim(),
      'Fresh from the sources'
    );
    assert.equal(
      document.querySelector('[data-feature-card] [data-text-link]')?.textContent.trim(),
      'Read the post'
    );
    assert.equal(document.querySelector('[data-hero-copy]')?.tagName, 'ARTICLE');
    assert.equal(document.querySelector('[data-hero-panel]')?.tagName, 'ARTICLE');
    assert.equal(document.querySelector('[data-hero-actions]')?.tagName, 'SECTION');
    assert.equal(document.querySelector('[data-hero-topics]')?.tagName, 'SECTION');
    assert.equal(
      document.querySelector('[data-hero-topics-title]')?.textContent.trim(),
      'Popular Topics'
    );
    assert.equal(document.querySelector('[data-hero-stats]')?.tagName, 'SECTION');
    assert.deepEqual(
      Array.from(document.querySelectorAll('[data-hero-stats] > *')).map((node) => node.tagName),
      ['DL', 'DL', 'DL', 'DL', 'DL', 'DL']
    );
    assert.equal(document.querySelector('[data-section-heading] > header')?.tagName, 'HEADER');
    assert.equal(document.querySelector('[data-section-heading-actions]')?.tagName, 'SECTION');
  });

  test('component CSS renders CTA arrows with SVG masks and crops side media predictably', () => {
    const css = readFileSync('src/styles/layers/components.css', 'utf8');
    const textLinkRule =
      css.match(
        /:where\(\[data-text-link\],\s*\[data-button\]\[href\]\)::after\s*\{(?<body>[^}]*)\}/s
      )?.groups?.body || '';
    const postCardRule = css.match(/\[data-post-card\]\s*\{(?<body>[^}]*)\}/s)?.groups?.body || '';
    const sideMediaRule =
      css.match(
        /\[data-post-feed-variant='feature-list'\][^{}]*\[data-post-card-media\]\s*\{(?<body>[^}]*)\}/s
      )?.groups?.body || '';
    const sideMediaImageRule =
      css.match(
        /\[data-post-feed-variant='feature-list'\][^{}]*\[data-post-card-media\]\s+img\s*\{(?<body>[^}]*)\}/s
      )?.groups?.body || '';

    assert.match(textLinkRule, /mask:/);
    assert.match(textLinkRule, /data:image\/svg\+xml/);
    assert.match(postCardRule, /display:\s*flex;/);
    assert.doesNotMatch(postCardRule, /display:\s*grid;/);
    assert.doesNotMatch(css, /content:\s*['"]->['"]/);
    assert.match(sideMediaRule, /aspect-ratio:\s*var\(--dout--media-ratio-card\);/);
    assert.match(sideMediaRule, /align-self:\s*stretch;/);
    assert.match(sideMediaImageRule, /display:\s*block;/);
    assert.match(sideMediaImageRule, /block-size:\s*100%;/);
    assert.match(sideMediaImageRule, /object-fit:\s*cover;/);
    assert.doesNotMatch(sideMediaImageRule, /aspect-ratio:\s*auto;/);
  });

  test('post sidebar keeps the table of contents sticky without pinning the series list', () => {
    const css = readFileSync('src/styles/layers/components.css', 'utf8');
    const sidebarRule =
      css.match(/\[data-post-sidebar\]\s*\{(?<body>[^}]*)\}/s)?.groups?.body || '';
    const tocRule = css.match(/\[data-post-toc\]\s*\{(?<body>[^}]*)\}/s)?.groups?.body || '';
    const seriesRule =
      css.match(/\[data-series-navigation\]\s*\{(?<body>[^}]*)\}/s)?.groups?.body || '';

    assert.match(sidebarRule, /position:\s*sticky;/);
    assert.match(sidebarRule, /top:/);
    assert.match(sidebarRule, /display:\s*flex;/);
    assert.match(sidebarRule, /flex-direction:\s*column;/);
    assert.doesNotMatch(sidebarRule, /max-block-size:/);
    assert.doesNotMatch(tocRule, /overflow:/);
    assert.doesNotMatch(tocRule, /max-block-size:|min-block-size:/);
    assert.doesNotMatch(seriesRule, /position:\s*sticky;/);
    assert.doesNotMatch(seriesRule, /bottom:/);
    assert.doesNotMatch(seriesRule, /overflow:/);
    assert.doesNotMatch(seriesRule, /max-block-size:|min-block-size:/);
  });

  test('base layout renders a CSS skeleton while user preferences load', () => {
    const document = renderDocument('src/templates/home.html', {
      canonicalUrl: 'https://dout.dev/',
      description: 'Latest field notes from dout.dev.',
      featuredPost: null,
      featuredPosts: [],
      loadMore: null,
      ogImageUrl: 'https://dout.dev/assets/og/pages/home.png',
      posts: [],
      stats: { posts: 0, series: 0, tags: 0 },
      title: 'dout.dev',
      topTags: [],
    });
    const html = document.documentElement.outerHTML;

    assert.notEqual(document.querySelector('[data-preferences-skeleton]'), null);
    assert.equal(
      document.querySelector('[data-preferences-skeleton]')?.getAttribute('aria-hidden'),
      'true'
    );
    assert.notEqual(
      document.querySelector('script[type="module"][src="/scripts/user-preferences-bootstrap.js"]'),
      null
    );
    assert.match(html, /dataset\.userPreferences\s*=\s*'loading'/);
  });

  test('preference skeleton CSS hides page chrome until bootstrap marks it ready', () => {
    const css = readFileSync('src/styles/layers/components.css', 'utf8');

    assert.match(
      css,
      /:root\[data-user-preferences='loading'\]\s+\[data-preferences-skeleton\]\s*\{/s
    );
    assert.match(
      css,
      /:root\[data-user-preferences='loading'\]\s+\[data-site-shell\]\s*>\s*:not\(\[data-preferences-skeleton\]\)/s
    );
    assert.match(css, /\[data-skeleton-text\]\s*\{/s);
    assert.match(css, /\[data-skeleton-media\]\s*\{/s);
    assert.match(
      css,
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\[data-preferences-skeleton\]/s
    );
  });
});
