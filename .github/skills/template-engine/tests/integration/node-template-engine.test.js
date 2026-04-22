import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import TemplateEngine from '../../code/public/node.js';

describe('skill-pack node adapter', () => {
  test('renders includes with data payloads and loop metadata', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'template-skill-node-'));

    try {
      writeFileSync(
        join(tempDir, 'card.html'),
        `<article>
  <switch expr="headingLevel">
    <case value="3"><h3>{{ post.title }}</h3></case>
    <default><h2>{{ post.title }}</h2></default>
  </switch>
  <if condition="showCover && post.coverImage">
    <img src="{{ post.coverImage }}" alt="" />
  </if>
  <p>{{ loop.length }}</p>
</article>`
      );

      writeFileSync(
        join(tempDir, 'page.html'),
        `<for each="post in posts">
  <include src="./card.html" data='{"post": {{ post | json | raw }}, "headingLevel": "3", "showCover": true}'></include>
</for>`
      );

      const engine = new TemplateEngine({ rootDir: tempDir });
      const result = engine.render('page.html', {
        posts: [{ title: 'Card Title', coverImage: '/assets/cover.jpg' }],
      });

      assert.match(result, /<h3>Card Title<\/h3>/);
      assert.match(result, /src="\/assets\/cover.jpg"/);
      assert.match(result, /<p>1<\/p>/);
      assert.ok(!result.includes('<include'));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('renders extends and blocks from disk', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'template-skill-node-layout-'));

    try {
      writeFileSync(
        join(tempDir, 'base.html'),
        `<!DOCTYPE html>
<html>
  <body>
    <header>Base Header</header>
    <block name="content">Default content</block>
  </body>
</html>`
      );

      writeFileSync(
        join(tempDir, 'child.html'),
        `<extends src="base.html" />
<block name="content"><main>{{ pageTitle }}</main></block>`
      );

      const engine = new TemplateEngine({ rootDir: tempDir });
      const result = engine.render('child.html', { pageTitle: 'Portable Page' });

      assert.match(result, /Base Header/);
      assert.match(result, /Portable Page/);
      assert.ok(!result.includes('<extends'));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
