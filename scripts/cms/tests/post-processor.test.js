import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { processMarkdown } from '../post-processor.js';

describe('post-processor', () => {
  test('processMarkdown should process basic post with front-matter', () => {
    const filePath = '/test/2023-12-01-sample-post.md';
    const raw = `---
title: "My Test Post"
published: true
tags: ["javascript", "testing"]
---

# Hello World

This is a test post with some content.

Another paragraph here.`;

    const result = processMarkdown(filePath, raw);

    assert.strictEqual(result.name, '2023-12-01-sample-post');
    assert.strictEqual(result.title, 'My Test Post');
    assert.strictEqual(result.published, true);
    assert.strictEqual(result.layout, 'post');
    assert.ok(result.content.includes('<h1'));
    assert.ok(result.content.includes('Hello World'));
    assert.ok(result.excerpt.includes('Hello World'));
    assert.strictEqual(result.tags.length, 2);
    assert.strictEqual(result.tags[0].key, 'javascript');
    assert.strictEqual(result.tags[0].label, 'Javascript');
  });

  test('processMarkdown should infer title from filename when front-matter is missing', () => {
    const filePath = '/test/2023-11-15-hello-world-post.md';
    const raw = `# Content

This is a post without front-matter.`;

    const result = processMarkdown(filePath, raw);

    assert.strictEqual(result.name, '2023-11-15-hello-world-post');
    assert.strictEqual(result.title, 'Hello World Post'); // Inferred from filename
    assert.strictEqual(result.published, true); // Default
    assert.strictEqual(result.layout, 'post'); // Default
    assert.strictEqual(result.pinned, false); // Default
    assert.ok(result.date); // Date inferred from filename
    assert.strictEqual(result.tags.length, 0); // No tags
  });

  test('processMarkdown should normalize tags from comma-separated string', () => {
    const filePath = '/test/post-with-string-tags.md';
    const raw = `---
title: "Test Tags"
tags: "javascript, css, html, web-dev"
---

Post content.`;

    const result = processMarkdown(filePath, raw);

    assert.strictEqual(result.tags.length, 4);
    assert.strictEqual(result.tags[0].key, 'javascript');
    assert.strictEqual(result.tags[0].label, 'Javascript');
    assert.strictEqual(result.tags[1].key, 'css');
    assert.strictEqual(result.tags[1].label, 'Css');
    assert.strictEqual(result.tags[3].key, 'web-dev');
    assert.strictEqual(result.tags[3].label, 'Web-dev');
  });

  test('processMarkdown should create clean excerpt removing markdown', () => {
    const filePath = '/test/markdown-rich-post.md';
    const raw = `---
title: "Rich Markdown Post"
---

# Heading **bold** *italic* and [link](https://example.com) with \`code\`

Second paragraph that should not be in excerpt.`;

    const result = processMarkdown(filePath, raw);

    // Excerpt should be only the first "paragraph" without markdown symbols
    assert.ok(result.excerpt.includes('Heading'));
    assert.ok(result.excerpt.includes('bold'));
    assert.ok(result.excerpt.includes('italic'));
    assert.ok(!result.excerpt.includes('#'));
    assert.ok(!result.excerpt.includes('**'));
    assert.ok(!result.excerpt.includes('*'));
    assert.ok(!result.excerpt.includes('['));
    assert.ok(!result.excerpt.includes('`'));
    assert.ok(!result.excerpt.includes('Second paragraph'));
  });

  test('processMarkdown should handle unpublished post and custom fields', () => {
    const filePath = '/test/draft-post.md';
    const raw = `---
title: "Draft Post"
published: false
pinned: true
layout: "special"
---

Draft content.`;

    const result = processMarkdown(filePath, raw);

    assert.strictEqual(result.published, false);
    assert.strictEqual(result.pinned, true);
    assert.strictEqual(result.layout, 'special');
    assert.strictEqual(result.name, 'draft-post');
  });

  test('processMarkdown should handle explicit vs inferred dates', () => {
    // Test with explicit date in front-matter
    const filePath1 = '/test/2023-01-01-old-filename.md';
    const raw1 = `---
title: "Post with explicit date"
date: "2024-06-15"
---

Content with explicit date.`;

    const result1 = processMarkdown(filePath1, raw1);
    assert.ok(result1.date.includes('2024-06-15')); // Date from front-matter

    // Test with date inferred from filename
    const filePath2 = '/test/2023-12-25-christmas-post.md';
    const raw2 = `---
title: "Christmas Post"
---

Content without date in front-matter.`;

    const result2 = processMarkdown(filePath2, raw2);
    assert.ok(result2.date.includes('2023-12-25')); // Date from filename
  });

  test('processMarkdown should handle edge cases (invalid dates, null tags)', () => {
    const filePath = '/test/edge-case-post.md';
    const raw = `---
title: "Edge Case Post"
date: "invalid-date"
tags: null
---

Minimal content.`;

    const result = processMarkdown(filePath, raw);

    assert.strictEqual(result.date, null); // Invalid date becomes null
    assert.strictEqual(result.dateString, null);
    assert.strictEqual(result.tags.length, 0); // Null tags becomes empty array
    assert.strictEqual(result.title, 'Edge Case Post');
    assert.ok(result.excerpt.includes('Minimal content'));
  });

  test('processMarkdown should work with real file from data folder', () => {
    const filePath = 'data/posts/2022-03-24-welcome-to-dout-dev.md';
    const raw = readFileSync(filePath, 'utf8');

    const result = processMarkdown(filePath, raw);

    assert.strictEqual(result.name, '2022-03-24-welcome-to-dout-dev');
    assert.strictEqual(result.title, 'Welcome to dout.dev');
    assert.strictEqual(result.published, true);
    assert.ok(result.date.includes('2022-03-24'));
    assert.strictEqual(result.tags.length, 1);
    assert.strictEqual(result.tags[0].key, 'generic');
    assert.strictEqual(result.tags[0].label, 'Generic');
    assert.ok(result.content.includes('<p>'));
    assert.ok(result.excerpt.includes('Emiliano'));
    assert.strictEqual(result.layout, 'post');
  });

  test('processMarkdown should sanitize raw HTML and build a readable excerpt', () => {
    const filePath = '/test/embed-heavy-post.md';
    const raw = `---
title: "Embed Heavy Post"
---

<script>alert('xss')</script>

<iframe height="300" title="CodePen demo" src="https://codepen.io/pixu1980/embed/LYOJpBz"></iframe>

## Safe heading

The first readable paragraph should become the excerpt.`;

    const result = processMarkdown(filePath, raw);

    assert.equal(result.content.includes('<script'), false);
    assert.equal(
      result.content.includes('sandbox="allow-popups allow-same-origin allow-scripts"'),
      true
    );
    assert.match(
      result.excerpt,
      /(Safe heading|The first readable paragraph should become the excerpt\.)/
    );
  });
});
