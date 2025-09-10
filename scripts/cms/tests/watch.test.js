import { test, describe } from 'node:test';
import assert from 'node:assert';
import { mkdir, writeFile } from 'node:fs/promises';
import { startWatch } from '../watch.js';

describe('watch', () => {
  test('should start watching and return watcher object', () => {
    const watcher = startWatch();

    // Should return a watcher object with close method
    assert.strictEqual(typeof watcher, 'object');
    assert.strictEqual(typeof watcher.close, 'function');

    // Clean up
    watcher.close();
  });

  test('should call onBuild callback when triggered', async () => {
    // Ensure content directory and a test markdown file exist
    try {
      await mkdir('data/posts', { recursive: true });
      await writeFile('data/posts/test.md', '# Test\nContent', 'utf8');
    } catch {
      // Continue anyway
    }

    return new Promise((resolve, reject) => {
      let callbackCalled = false;
      let settled = false;

      const onBuild = (dataset) => {
        if (settled) return;

        settled = true;
        callbackCalled = true;

        // Just verify we got a dataset object
        assert.strictEqual(typeof dataset, 'object', 'dataset should be an object');

        // Clean up and finish test
        watcher.close();
        resolve();
      };

      const watcher = startWatch({}, onBuild);

      // The initial trigger should call onBuild within 8 seconds
      setTimeout(() => {
        if (!callbackCalled && !settled) {
          settled = true;
          watcher.close();
          reject(new Error('Callback was not called after 8 seconds'));
        }
      }, 8000);
    });
  });

  test('should work with custom configuration', () => {
    const customConfig = {
      contentDir: 'data/posts',
    };

    const watcher = startWatch(customConfig);

    // Should still return a valid watcher
    assert.strictEqual(typeof watcher, 'object');
    assert.strictEqual(typeof watcher.close, 'function');

    // Clean up
    watcher.close();
  });
});
