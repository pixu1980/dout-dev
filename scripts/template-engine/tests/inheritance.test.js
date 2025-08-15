#!/usr/bin/env node
/**
 * Template Engine Tests - Template Inheritance Complete Suite
 * Test completi per l'ereditarietà dei template e gli include con sintassi XML
 * Conforme agli standard definiti in COPILOT_RULES.md
 */

import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { TemplateEngine } from '../index.js';

const TEST_DIR = join(process.cwd(), 'test-tmp-inheritance');

function setupTestDir() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (_) {
    // Directory might not exist
  }
  mkdirSync(TEST_DIR, { recursive: true });
}

function cleanupTestDir() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (_) {
    // Ignore cleanup errors
  }
}

describe('TemplateEngine - Template Inheritance', () => {

  test('should process extends and blocks', () => {
    setupTestDir();

    // Base template
    const baseContent = `
<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
</head>
<body>
  <header>Site Header</header>
  <main>
    <block name="content">
    Default content
    </block>
  </main>
  <footer>Site Footer</footer>
</body>
</html>`.trim();

    // Child template
    const childContent = `
<extends src="base.html">

<block name="content">
<h1>{{ pageTitle }}</h1>
<p>{{ pageContent }}</p>
</block>`.trim();

    writeFileSync(join(TEST_DIR, 'base.html'), baseContent);
    writeFileSync(join(TEST_DIR, 'child.html'), childContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('child.html', {
      title: 'Test Page',
      pageTitle: 'Welcome',
      pageContent: 'Hello World'
    });

    assert.ok(result.includes('Test Page'));
    assert.ok(result.includes('Site Header'));
    assert.ok(result.includes('Welcome'));
    assert.ok(result.includes('Hello World'));
    assert.ok(result.includes('Site Footer'));

    cleanupTestDir();
  });

  test('should process includes', () => {
    setupTestDir();

    // Component template
    const componentContent = `
<div class="component">
  <h3>{{ componentTitle }}</h3>
  <p>{{ componentText }}</p>
</div>`.trim();

    // Main template
    const mainContent = `
<div>
  <h1>{{ title }}</h1>
  <include src="component.html" />
</div>`.trim();

    writeFileSync(join(TEST_DIR, 'component.html'), componentContent);
    writeFileSync(join(TEST_DIR, 'main.html'), mainContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('main.html', {
      title: 'Main Page',
      componentTitle: 'Component Title',
      componentText: 'Component Text'
    });

    assert.ok(result.includes('Main Page'));
    assert.ok(result.includes('Component Title'));
    assert.ok(result.includes('Component Text'));
    assert.ok(result.includes('class="component"'));

    cleanupTestDir();
  });

  test('should handle nested includes', () => {
    setupTestDir();

    // Inner component
    const innerContent = `<span class="inner">{{ innerText }}</span>`;

    // Outer component
    const outerContent = `
<div class="outer">
  <h4>{{ outerTitle }}</h4>
  <include src="inner.html" />
</div>`.trim();

    // Main template
    const mainContent = `
<div>
  <include src="outer.html" />
</div>`.trim();

    writeFileSync(join(TEST_DIR, 'inner.html'), innerContent);
    writeFileSync(join(TEST_DIR, 'outer.html'), outerContent);
    writeFileSync(join(TEST_DIR, 'main.html'), mainContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('main.html', {
      outerTitle: 'Outer Title',
      innerText: 'Inner Text'
    });

    assert.ok(result.includes('Outer Title'));
    assert.ok(result.includes('Inner Text'));
    assert.ok(result.includes('class="outer"'));
    assert.ok(result.includes('class="inner"'));

    cleanupTestDir();
  });

  test('should handle template with complex structure', () => {
    setupTestDir();

    // Base layout
    const baseContent = `
<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
</head>
<body>
  <block name="content">Default</block>
  <include src="footer.html" />
</body>
</html>`.trim();

    // Footer component
    const footerContent = `
<footer>
  <p>&copy; {{ year }} {{ siteName }}</p>
</footer>`.trim();

    // Page template
    const pageContent = `
<extends src="base.html">

<block name="content">
<main>
  <h1>{{ pageTitle }}</h1>
  <include src="sidebar.html" />
</main>
</block>`.trim();

    // Sidebar component
    const sidebarContent = `
<aside>
  <h3>Sidebar</h3>
  <p>{{ sidebarContent }}</p>
</aside>`.trim();

    writeFileSync(join(TEST_DIR, 'base.html'), baseContent);
    writeFileSync(join(TEST_DIR, 'footer.html'), footerContent);
    writeFileSync(join(TEST_DIR, 'page.html'), pageContent);
    writeFileSync(join(TEST_DIR, 'sidebar.html'), sidebarContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('page.html', {
      title: 'Complex Page',
      pageTitle: 'Welcome to Complex Page',
      year: '2023',
      siteName: 'My Site',
      sidebarContent: 'Sidebar information'
    });

    assert.ok(result.includes('Complex Page'));
    assert.ok(result.includes('Welcome to Complex Page'));
    assert.ok(result.includes('Sidebar'));
    assert.ok(result.includes('Sidebar information'));
    assert.ok(result.includes('2023 My Site'));

    cleanupTestDir();
  });

});
