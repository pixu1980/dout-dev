#!/usr/bin/env node
/**
 * Template Engine Tests - Core functionality tests
 * Tests per la funzionalità principale del Template Engine
 * Conforme agli standard definiti in COPILOT_RULES.md
 */

import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { TemplateEngine } from '../index.js';

const TEST_DIR = join(process.cwd(), 'test-tmp');

// Setup per ogni test
function setupTestDir() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (_error) {
    // Directory might not exist
  }
  mkdirSync(TEST_DIR, { recursive: true });
}

// Cleanup dopo ogni test
function cleanupTestDir() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (_error) {
    // Ignore cleanup errors
  }
}

describe('TemplateEngine - Core Functionality', () => {
  test('should create template engine instance', () => {
    const engine = new TemplateEngine();
    assert.ok(engine instanceof TemplateEngine);
    assert.ok(engine.renderer);
  });

  test('should render simple template with variables', () => {
    setupTestDir();

    const templateContent = '<h1>{{ title }}</h1><p>{{ description }}</p>';
    const templatePath = join(TEST_DIR, 'simple.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('simple.html', {
      title: 'Test Title',
      description: 'Test Description',
    });

    assert.strictEqual(result, '<h1>Test Title</h1><p>Test Description</p>');

    cleanupTestDir();
  });

  test('should handle missing variables gracefully', () => {
    setupTestDir();

    const templateContent = '<h1>{{ title }}</h1><p>{{ missing }}</p>';
    const templatePath = join(TEST_DIR, 'missing.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('missing.html', {
      title: 'Test Title',
    });

    assert.strictEqual(result, '<h1>Test Title</h1><p></p>');

    cleanupTestDir();
  });

  test('should support nested object properties', () => {
    setupTestDir();

    const templateContent = '<h1>{{ post.title }}</h1><p>{{ post.meta.author }}</p>';
    const templatePath = join(TEST_DIR, 'nested.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    const result = engine.render('nested.html', {
      post: {
        title: 'Post Title',
        meta: {
          author: 'John Doe',
        },
      },
    });

    assert.strictEqual(result, '<h1>Post Title</h1><p>John Doe</p>');

    cleanupTestDir();
  });

  test('should register and use custom filters', () => {
    setupTestDir();

    const templateContent = '<h1>{{ title | uppercase }}</h1>';
    const templatePath = join(TEST_DIR, 'filter.html');
    writeFileSync(templatePath, templateContent);

    const engine = new TemplateEngine({ rootDir: TEST_DIR });
    engine.registerFilter('uppercase', (value) => String(value).toUpperCase());

    const result = engine.render('filter.html', {
      title: 'test title',
    });

    assert.strictEqual(result, '<h1>TEST TITLE</h1>');

    cleanupTestDir();
  });

  test('should handle template rendering errors', () => {
    const engine = new TemplateEngine({ rootDir: TEST_DIR });

    assert.throws(
      () => {
        engine.render('nonexistent.html', {});
      },
      {
        name: 'Error',
      }
    );
  });
});
