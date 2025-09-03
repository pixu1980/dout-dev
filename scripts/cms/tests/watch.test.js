import { test, describe } from 'node:test';
import assert from 'node:assert';
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

  test('should call onBuild callback when triggered', (_t, done) => {
    let callbackCalled = false;

    const onBuild = (dataset) => {
      callbackCalled = true;
      assert.strictEqual(typeof dataset, 'object');
      assert.ok(Array.isArray(dataset.posts));

      // Clean up and finish test
      watcher.close();
      done();
    };

    const watcher = startWatch({}, onBuild);

    // The initial trigger should call onBuild
    setTimeout(() => {
      if (!callbackCalled) {
        watcher.close();
        done(new Error('Callback was not called'));
      }
    }, 200);
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
