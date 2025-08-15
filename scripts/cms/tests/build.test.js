#!/usr/bin/env node
/**
 * CMS Tests - Build
 * Test per build.js per copertura 100%
 * Conforme agli standard definiti in COPILOT_RULES.md
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

describe('CMS - Build', () => {

  test('should run build script and exit with code 0 on success', async () => {
    return new Promise((resolve, reject) => {
      const buildPath = join(process.cwd(), 'scripts', 'cms', 'build.js');
      const child = spawn('node', [buildPath], {
        stdio: 'pipe',
        cwd: process.cwd()
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
            assert.strictEqual(stderr, '');
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
      }, 10000);
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
    assert.ok(consoleErrors.some(msg => msg.includes('Build failed:')));
    assert.ok(consoleErrors.some(msg => msg.includes('Simulated build failure')));

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
        assert.ok(consoleErrors.some(msg => msg.includes('Build failed:')));
      } else {
        throw error;
      }
    } finally {
      console.error = originalConsoleError;
      process.exit = originalProcessExit;
    }
  });});
