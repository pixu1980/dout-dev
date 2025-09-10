import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildJsonFeed, buildRssFeed } from '../page-generator.js';

test('buildRssFeed emits a self-referencing RSS document', () => {
  const xml = buildRssFeed({
    title: 'dout.dev — Latest Posts',
    link: 'https://dout.dev/',
    description: 'Latest posts',
    siteUrl: 'https://dout.dev',
    feedUrl: 'https://dout.dev/feed.rss',
    language: 'en',
    items: [
      { name: 'hello-world', title: 'Hello World', excerpt: 'Example excerpt', date: '2026-04-04' },
    ],
  });

  assert.match(xml, /<rss version="2.0" xmlns:atom=/);
  assert.match(
    xml,
    /<atom:link href="https:\/\/dout.dev\/feed.rss" rel="self" type="application\/rss\+xml"/
  );
  assert.match(xml, /<language>en<\/language>/);
  assert.match(xml, /<title>Hello World<\/title>/);
});

test('buildJsonFeed emits JSON Feed 1.1 with image and tags', () => {
  const raw = buildJsonFeed({
    title: 'dout.dev — Latest Posts',
    homePageUrl: 'https://dout.dev/',
    feedUrl: 'https://dout.dev/feed.json',
    description: 'Latest posts',
    siteUrl: 'https://dout.dev',
    author: 'Emiliano',
    language: 'en',
    items: [
      {
        name: 'hello-world',
        title: 'Hello World',
        excerpt: 'Example excerpt',
        content: '<p>Hello world</p>',
        date: '2026-04-04',
        tags: [{ key: 'css', label: 'CSS' }],
      },
    ],
  });

  const feed = JSON.parse(raw);
  assert.equal(feed.version, 'https://jsonfeed.org/version/1.1');
  assert.equal(feed.feed_url, 'https://dout.dev/feed.json');
  assert.equal(feed.items[0].image, 'https://dout.dev/assets/og/posts/hello-world.png');
  assert.deepEqual(feed.items[0].tags, ['CSS']);
});
