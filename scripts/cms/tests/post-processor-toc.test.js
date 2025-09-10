import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { processMarkdown } from '../post-processor.js';

describe('post-processor toc', () => {
  test('processMarkdown should generate a toc and focusable article headings', () => {
    const filePath = '/test/2026-04-04-outline-post.md';
    const raw = `---
title: "Outline Post"
---

## First Section

Alpha paragraph.

### Nested Topic

Beta paragraph.

## First Section

Gamma paragraph.`;

    const result = processMarkdown(filePath, raw);

    assert.deepEqual(result.toc, [
      { id: 'first-section', level: 2, text: 'First Section' },
      { id: 'nested-topic', level: 3, text: 'Nested Topic' },
      { id: 'first-section-2', level: 2, text: 'First Section' },
    ]);
    assert.ok(result.content.includes('id="first-section"'));
    assert.ok(result.content.includes('id="first-section-2"'));
    assert.ok(result.content.includes('tabindex="0"'));
    assert.ok(result.content.includes('data-toc-anchor="true"'));
  });

  test('processMarkdown should leave toc empty when no article headings are present', () => {
    const result = processMarkdown('/test/no-headings.md', 'Plain paragraph without headings.');

    assert.deepEqual(result.toc, []);
  });
});
