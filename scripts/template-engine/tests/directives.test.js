#!/usr/bin/env node
/**
 * Template Engine Tests - Directives (loops, conditionals, etc.)
 * Tests per le direttive del Template Engine - Sintassi XML corretta
 * Conforme agli standard definiti in COPILOT_RULES.md
 */

import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { TemplateEngine } from '../index.js';

const TEST_DIR = join(process.cwd(), 'test-tmp-directives');

function setupTestDir() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist
  }
  mkdirSync(TEST_DIR, { recursive: true });
}

function cleanupTestDir() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

describe('TemplateEngine - Directives', () => {

  test('should process for loops', () => {
    setupTestDir();

    const templateContent = `
<ul>
<for each="item in items">
<li>{{ item }}</li>
</for>
</ul>`.trim();

    const templatePath = join(TEST_DIR, 'loop.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('loop.html', {
      items: ['Item 1', 'Item 2', 'Item 3']
    });

    assert.ok(result.includes('Item 1'));
    assert.ok(result.includes('Item 2'));
    assert.ok(result.includes('Item 3'));

    cleanupTestDir();
  });

  test('should process for loops with objects', () => {
    setupTestDir();

    const templateContent = `
<div>
<for each="post in posts">
<h2>{{ post.title }}</h2>
<p>{{ post.content }}</p>
</for>
</div>`.trim();

    const templatePath = join(TEST_DIR, 'loop-objects.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('loop-objects.html', {
      posts: [
        { title: 'Post 1', content: 'Content 1' },
        { title: 'Post 2', content: 'Content 2' }
      ]
    });

    assert.ok(result.includes('Post 1'));
    assert.ok(result.includes('Content 1'));
    assert.ok(result.includes('Post 2'));
    assert.ok(result.includes('Content 2'));

    cleanupTestDir();
  });

  test('should handle empty loops', () => {
    setupTestDir();

    const templateContent = `
<ul>
<for each="item in items">
<li>{{ item }}</li>
</for>
</ul>`.trim();

    const templatePath = join(TEST_DIR, 'empty-loop.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('empty-loop.html', {
      items: []
    });

    // Empty loop should not add content
    assert.ok(result.includes('<ul>'));
    assert.ok(result.includes('</ul>'));

    cleanupTestDir();
  });

  test('should process if conditionals', () => {
    setupTestDir();

    const templateContent = `
<div>
<if condition="showContent">
<p>Content is visible</p>
</if>
</div>`.trim();

    const templatePath = join(TEST_DIR, 'if.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });

    // Test truthy condition
    let result = engine.render('if.html', { showContent: true });
    assert.ok(result.includes('Content is visible'));

    // Test falsy condition
    result = engine.render('if.html', { showContent: false });
    assert.ok(!result.includes('Content is visible'));

    cleanupTestDir();
  });

  test('should process switch statements', () => {
    setupTestDir();

    const templateContent = `
<div>
<switch expr="status">
<case value="published">
<p>Published content</p>
</case>
<case value="draft">
<p>Draft content</p>
</case>
<default>
<p>Unknown status</p>
</default>
</switch>
</div>`.trim();

    const templatePath = join(TEST_DIR, 'switch.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });

    // Test published case
    let result = engine.render('switch.html', { status: 'published' });
    assert.ok(result.includes('Published content'));

    // Test draft case
    result = engine.render('switch.html', { status: 'draft' });
    assert.ok(result.includes('Draft content'));

    // Test default case
    result = engine.render('switch.html', { status: 'unknown' });
    assert.ok(result.includes('Unknown status'));

    cleanupTestDir();
  });

  test('should process nested conditionals', () => {
    setupTestDir();

    const templateContent = `
<div>
<if condition="user">
  <if condition="user.admin">
  <p>Admin user</p>
  </if>
</if>
</div>`.trim();

    const templatePath = join(TEST_DIR, 'nested-if.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });

    // Test admin user
    let result = engine.render('nested-if.html', { user: { admin: true } });
    assert.ok(result.includes('Admin user'));

    // Test no user
    result = engine.render('nested-if.html', {});
    assert.ok(!result.includes('Admin user'));

    cleanupTestDir();
  });

  test('should process markdown blocks', () => {
    setupTestDir();

    const templateContent = `
<div>
<md>
# Heading
This is **bold** text.
</md>
</div>`.trim();

    const templatePath = join(TEST_DIR, 'markdown.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('markdown.html', {});

    assert.ok(result.includes('<h1>'));
    assert.ok(result.includes('<strong>'));

    cleanupTestDir();
  });

});
