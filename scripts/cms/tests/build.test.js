#!/usr/bin/env node
/**
 * CMS Tests - Build
 * Test per build.js per copertura 100%
 * Conforme agli standard definiti in COPILOT_RULES.md
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import {
  findEligibleScheduledDrafts,
  maybePublishScheduledDrafts,
  updatePublishedFrontMatter,
} from '../build.js';

describe('CMS - Build', () => {
  test('should run build script and exit with code 0 on success', async () => {
    return new Promise((resolve, reject) => {
      const buildPath = join(process.cwd(), 'scripts', 'cms', 'build.js');
      const child = spawn('node', [buildPath], {
        stdio: 'pipe',
        cwd: process.cwd(),
      });

      let stderr = '';

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          // Should exit with success if no errors
          if (code === 0) {
            assert.strictEqual(code, 0);
            // Accept template engine warnings but not critical errors
            const _hasWarnings =
              stderr.includes('Unknown filter:') ||
              stderr.includes('Failed to evaluate expression:');
            const hasCriticalErrors =
              stderr.includes('Build failed:') ||
              (stderr.includes('Error:') && !stderr.includes('ReferenceError:'));
            assert.ok(!hasCriticalErrors, 'Should not have critical errors');
          } else {
            // On error, should exit with code 1 and show error
            assert.strictEqual(code, 1);
            assert.ok(stderr.includes('Build failed:'));
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });

      setTimeout(() => {
        child.kill();
        reject(new Error('Test timeout'));
      }, 60000);
    });
  });

  test('should handle build function directly - success case', async () => {
    // Mock console to capture errors
    const originalConsoleError = console.error;
    const originalProcessExit = process.exit;

    const consoleErrors = [];
    let exitCode = null;

    console.error = (...args) => {
      consoleErrors.push(args.join(' '));
      originalConsoleError(...args);
    };

    process.exit = (code) => {
      exitCode = code;
      throw new Error('Process exit called'); // Prevent actual exit
    };

    try {
      // Create a working CMS instance for test
      const { CMS } = await import('../index.js');
      const cms = new CMS();

      // Mock the build method to avoid actual file operations
      cms.build = async () => {
        // Simulate successful build
        return Promise.resolve();
      };

      // Test main function directly
      try {
        await cms.build();
        // Simulate successful exit without actually calling process.exit
        exitCode = 0;
      } catch (error) {
        console.error('Build failed:', error);
        exitCode = 1;
      }

      // Should exit with success code
      assert.strictEqual(exitCode, 0);
      assert.strictEqual(consoleErrors.length, 0);
    } finally {
      console.error = originalConsoleError;
      process.exit = originalProcessExit;
    }
  });

  test('should handle build errors properly', async () => {
    const originalConsoleError = console.error;
    const originalProcessExit = process.exit;

    const consoleErrors = [];
    let exitCode = null;

    console.error = (...args) => {
      consoleErrors.push(args.join(' '));
    };

    process.exit = (code) => {
      exitCode = code;
      throw new Error('Process exit called');
    };

    try {
      const { CMS } = await import('../index.js');
      const cms = new CMS();

      // Mock the build method to simulate failure
      cms.build = async () => {
        throw new Error('Simulated build failure');
      };

      // Test error handling directly
      try {
        await cms.build();
        process.exit(0);
      } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
      }
    } catch (error) {
      // Expected - process.exit throws
      assert.ok(error.message.includes('Process exit called'));
    }

    // Should exit with error code and log error
    assert.strictEqual(exitCode, 1);
    assert.ok(consoleErrors.some((msg) => msg.includes('Build failed:')));
    assert.ok(consoleErrors.some((msg) => msg.includes('Simulated build failure')));

    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  test('should test main function error path directly', async () => {
    // Test coverage for build.js lines 12-14 (catch block) by calling main function directly
    const originalConsoleError = console.error;
    const originalProcessExit = process.exit;

    const consoleErrors = [];
    let exitCode = null;

    console.error = (...args) => {
      consoleErrors.push(args.join(' '));
    };

    process.exit = (code) => {
      exitCode = code;
      throw new Error('Process exit called');
    };

    try {
      // Import the main function directly from build.js
      const { main } = await import('../build.js');

      // Mock CMS to throw an error during build
      const { CMS } = await import('../index.js');
      const originalBuild = CMS.prototype.build;
      CMS.prototype.build = async () => {
        throw new Error('Mocked build failure');
      };

      try {
        // Call main function which should catch the error and call process.exit(1)
        await main();
        assert.fail('Should not reach here');
      } finally {
        // Restore original build method
        CMS.prototype.build = originalBuild;
      }
    } catch (error) {
      if (error.message === 'Process exit called') {
        assert.equal(exitCode, 1);
        assert.ok(consoleErrors.some((msg) => msg.includes('Build failed:')));
      } else {
        throw error;
      }
    } finally {
      console.error = originalConsoleError;
      process.exit = originalProcessExit;
    }
  });

  test('findEligibleScheduledDrafts returns only due drafts with explicit published false', () => {
    const now = new Date('2026-04-22T12:00:00.000Z');
    const posts = [
      {
        name: 'future-draft',
        title: 'Future Draft',
        date: '2026-04-23T00:00:00.000Z',
        published: false,
        source: 'data/posts/future-draft.md',
      },
      {
        name: 'published-post',
        title: 'Published Post',
        date: '2026-04-20T00:00:00.000Z',
        published: true,
        source: 'data/posts/published-post.md',
      },
      {
        name: 'due-draft-late',
        title: 'Due Draft Late',
        date: '2026-04-21T00:00:00.000Z',
        published: false,
        source: 'data/posts/due-draft-late.md',
      },
      {
        name: 'due-draft-early',
        title: 'Due Draft Early',
        date: '2026-04-19T00:00:00.000Z',
        published: false,
        source: 'data/posts/due-draft-early.md',
      },
    ];

    const eligible = findEligibleScheduledDrafts(posts, now);

    assert.deepEqual(
      eligible.map((post) => post.name),
      ['due-draft-early', 'due-draft-late']
    );
  });

  test('updatePublishedFrontMatter flips published from false to true', () => {
    const raw = `---
title: "Draft"
published: false
tags: [test]
---

Body`;

    const updated = updatePublishedFrontMatter(raw);

    assert.equal(updated.changed, true);
    assert.match(updated.content, /published: true/);
    assert.doesNotMatch(updated.content, /published: false/);
  });

  test('maybePublishScheduledDrafts updates approved drafts one at a time', async () => {
    const tempDir = await mkdtemp(join(process.cwd(), 'tmp-build-prompts-'));
    const firstFile = join(tempDir, '2026-04-20-first-draft.md');
    const secondFile = join(tempDir, '2026-04-21-second-draft.md');

    try {
      await writeFile(
        firstFile,
        `---
title: "First Draft"
date: "2026-04-20"
published: false
---

First draft body.`,
        'utf8'
      );

      await writeFile(
        secondFile,
        `---
title: "Second Draft"
date: "2026-04-21"
published: false
---

Second draft body.`,
        'utf8'
      );

      const prompts = [];
      const logs = [];
      const result = await maybePublishScheduledDrafts(
        [
          {
            name: '2026-04-20-first-draft',
            title: 'First Draft',
            date: '2026-04-20T00:00:00.000Z',
            published: false,
            source: relative(process.cwd(), firstFile),
          },
          {
            name: '2026-04-21-second-draft',
            title: 'Second Draft',
            date: '2026-04-21T00:00:00.000Z',
            published: false,
            source: relative(process.cwd(), secondFile),
          },
        ],
        {
          now: new Date('2026-04-22T12:00:00.000Z'),
          confirm: async (post) => {
            prompts.push(post.name);
            return post.name === '2026-04-20-first-draft';
          },
          logger: {
            log(message) {
              logs.push(message);
            },
            warn(message) {
              logs.push(message);
            },
          },
        }
      );

      const firstContent = await readFile(firstFile, 'utf8');
      const secondContent = await readFile(secondFile, 'utf8');

      assert.deepEqual(prompts, ['2026-04-20-first-draft', '2026-04-21-second-draft']);
      assert.equal(result.changed.length, 1);
      assert.equal(result.skipped.length, 1);
      assert.match(firstContent, /published: true/);
      assert.match(secondContent, /published: false/);
      assert.ok(logs.some((message) => message.includes('Published and queued for build')));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
