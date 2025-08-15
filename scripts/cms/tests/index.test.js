#!/usr/bin/env node
/**
 * CMS Tests - Index (Main CMS Class)
 * Test per index.js per copertura 100%
 * Conforme agli standard definiti in COPILOT_RULES.md
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

describe('CMS - Main Class', () => {
  const testDir = join(process.cwd(), 'test-cms-index');
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  let consoleOutput = [];
  let consoleErrors = [];

  beforeEach(async () => {
    // Setup test directory
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
    await mkdir(testDir, { recursive: true });

    // Mock console
    consoleOutput = [];
    consoleErrors = [];

    console.log = (...args) => {
      consoleOutput.push(args.join(' '));
    };

    console.error = (...args) => {
      consoleErrors.push(args.join(' '));
    };
  });

  afterEach(async () => {
    // Cleanup
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }

    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  test('should create CMS instance with default config', async () => {
    const { CMS } = await import('../index.js');
    const cms = new CMS();

    assert.ok(cms.config);
    assert.ok(cms.postProcessor);
    assert.ok(cms.indexGenerator);
    assert.ok(cms.pageGenerator);
  });

  test('should create CMS instance with custom config', async () => {
    const { CMS } = await import('../index.js');
    const customConfig = {
      postsDir: testDir,
      outputDir: join(testDir, 'output'),
    };

    const cms = new CMS(customConfig);

    assert.strictEqual(cms.config.postsDir, customConfig.postsDir);
    assert.strictEqual(cms.config.outputDir, customConfig.outputDir);
  });

  test('should build successfully with posts', async () => {
    // Create test posts
    const postsDir = join(testDir, 'posts');
    await mkdir(postsDir, { recursive: true });

    await writeFile(join(postsDir, '2023-01-01-test-post.md'), `---
title: Test Post
date: 2023-01-01
tags: [test, sample]
published: true
---

# Test Post

This is a test post.
`);

    const { CMS } = await import('../index.js');
    const cms = new CMS({
      postsDir,
      outputDir: join(testDir, 'dist'),
      templatesDir: join(testDir, 'templates'),
    });

    // Mock the generators to avoid complex template requirements
    cms.postProcessor.processAllPosts = async () => [{
      name: '2023-01-01-test-post.md',
      title: 'Test Post',
      date: '2023-01-01',
      tags: [{ key: 'test', name: 'Test' }],
      published: true,
    }];

    cms.indexGenerator.generateIndices = async () => ({
      tags: [{ key: 'test', name: 'Test', count: 1 }],
      months: [{ key: '2023-01', name: 'January 2023', count: 1 }],
    });

    cms.pageGenerator.generateAllPages = async () => Promise.resolve();

    const result = await cms.build();

    assert.ok(result.posts);
    assert.ok(result.indices);
    assert.strictEqual(result.posts.length, 1);

    // Check console output
    assert.ok(consoleOutput.some(msg => msg.includes('🚀 Starting CMS build')));
    assert.ok(consoleOutput.some(msg => msg.includes('📝 Processing markdown posts')));
    assert.ok(consoleOutput.some(msg => msg.includes('📊 Generating indices')));
    assert.ok(consoleOutput.some(msg => msg.includes('📄 Generating static pages')));
    assert.ok(consoleOutput.some(msg => msg.includes('🎉 CMS build completed successfully')));
  });

  test('should handle build errors', async () => {
    const { CMS } = await import('../index.js');
    const cms = new CMS({
      postsDir: '/nonexistent',
      outputDir: join(testDir, 'dist'),
    });

    // Mock to throw error
    cms.postProcessor.processAllPosts = async () => {
      throw new Error('Test error');
    };

    try {
      await cms.build();
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.strictEqual(error.message, 'Test error');
      assert.ok(consoleErrors.some(msg => msg.includes('❌ CMS build failed')));
    }
  });

  test('should scan content and provide statistics', async () => {
    const { CMS } = await import('../index.js');
    const cms = new CMS();

    // Mock posts
    cms.postProcessor.processAllPosts = async () => [
      {
        name: '2023-01-01-post1.md',
        title: 'Post 1',
        date: '2023-01-01',
        tags: [{ key: 'test', name: 'Test' }, { key: 'sample', name: 'Sample' }],
        published: true,
      },
      {
        name: '2023-02-01-post2.md',
        title: 'Post 2',
        date: '2023-02-01',
        tags: [{ key: 'test', name: 'Test' }],
        published: false,
      },
    ];

    const stats = await cms.scan();

    assert.strictEqual(stats.total, 2);
    assert.strictEqual(stats.published, 1);
    assert.strictEqual(stats.drafts, 1);
    assert.strictEqual(stats.tags, 2);
    assert.strictEqual(stats.months, 2);
    assert.strictEqual(stats.tagCounts.test, 2);
    assert.strictEqual(stats.tagCounts.sample, 1);
    assert.strictEqual(stats.monthCounts['2023-01'], 1);
    assert.strictEqual(stats.monthCounts['2023-02'], 1);

    // Check console output
    assert.ok(consoleOutput.some(msg => msg.includes('🔍 Scanning content')));
    assert.ok(consoleOutput.some(msg => msg.includes('📊 Content Statistics')));
    assert.ok(consoleOutput.some(msg => msg.includes('Total posts: 2')));
    assert.ok(consoleOutput.some(msg => msg.includes('Published: 1')));
    assert.ok(consoleOutput.some(msg => msg.includes('Drafts: 1')));
  });

  test('should validate content with no errors', async () => {
    const { CMS } = await import('../index.js');
    const cms = new CMS();

    // Mock valid posts
    cms.postProcessor.processAllPosts = async () => [
      {
        name: '2023-01-01-valid-post.md',
        title: 'Valid Post',
        date: '2023-01-01',
        tags: [],
        published: true,
      },
    ];

    const result = await cms.validate();

    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.warnings.length, 0);

    assert.ok(consoleOutput.some(msg => msg.includes('🔍 Validating content')));
    assert.ok(consoleOutput.some(msg => msg.includes('✅ Content validation passed')));
  });

  test('should validate content with errors and warnings', async () => {
    const { CMS } = await import('../index.js');
    const cms = new CMS();

    // Mock posts with issues
    cms.postProcessor.processAllPosts = async () => [
      {
        name: 'invalid-filename.md',
        title: '',
        date: '',
        tags: [],
        published: true,
        coverImage: 'nonexistent.jpg',
      },
    ];

    const result = await cms.validate();

    assert.ok(result.errors.length > 0);
    assert.ok(result.warnings.length > 0);

    assert.ok(result.errors.some(err => err.includes('Missing title')));
    assert.ok(result.errors.some(err => err.includes('Missing date')));
    assert.ok(result.warnings.some(warn => warn.includes("doesn't follow YYYY-MM-DD-slug format")));

    assert.ok(consoleOutput.some(msg => msg.includes('❌ Validation errors')));
    assert.ok(consoleOutput.some(msg => msg.includes('⚠️  Validation warnings')));
  });

  test('should handle validation errors during processing', async () => {
    const { CMS } = await import('../index.js');
    const cms = new CMS();

    // Mock to throw error
    cms.postProcessor.processAllPosts = async () => {
      throw new Error('Processing error');
    };

    try {
      await cms.validate();
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.strictEqual(error.message, 'Processing error');
      assert.ok(consoleErrors.some(msg => msg.includes('❌ Validation failed')));
    }
  });

  test('should export CMS as default', async () => {
    const CMSDefault = (await import('../index.js')).default;
    const { CMS } = await import('../index.js');

    assert.strictEqual(CMSDefault, CMS);
  });

});
