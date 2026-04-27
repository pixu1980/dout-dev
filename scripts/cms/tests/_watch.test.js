import { test, describe } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startWatch } from '../_watch.js';

async function createWatchFixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'dout-watch-'));
  const contentDir = join(rootDir, 'content');

  await mkdir(contentDir, { recursive: true });
  await writeFile(
    join(contentDir, 'test.md'),
    `---
title: Watch Test
date: 2026-04-20
published: true
tags:
  - testing
---

Content`,
    'utf8'
  );

  return {
    rootDir,
    config: {
      contentDir,
      dataDir: join(rootDir, 'data'),
      postsOutputDir: join(rootDir, 'posts'),
      tagsOutputDir: join(rootDir, 'tags'),
      monthsOutputDir: join(rootDir, 'months'),
      seriesOutputDir: join(rootDir, 'series'),
      watchRecursive: false,
      watchFactory: () => ({
        close() {},
      }),
    },
  };
}

async function cleanupFixture(rootDir) {
  await rm(rootDir, { recursive: true, force: true });
}

describe('watch', () => {
  test('should start watching and return watcher object', async () => {
    const fixture = await createWatchFixture();
    const watcher = startWatch(fixture.config);

    try {
      assert.strictEqual(typeof watcher, 'object');
      assert.strictEqual(typeof watcher.close, 'function');
    } finally {
      watcher.close();
      await cleanupFixture(fixture.rootDir);
    }
  });

  test('should call onBuild callback when triggered', async () => {
    const fixture = await createWatchFixture();

    return new Promise((resolve, reject) => {
      let callbackCalled = false;
      let settled = false;

      const onBuild = async (dataset) => {
        if (settled) return;

        settled = true;
        callbackCalled = true;

        try {
          assert.strictEqual(typeof dataset, 'object', 'dataset should be an object');
          assert.strictEqual(dataset.posts.length, 1, 'dataset should contain the fixture post');
          watcher.close();
          await cleanupFixture(fixture.rootDir);
          resolve();
        } catch (error) {
          watcher.close();
          await cleanupFixture(fixture.rootDir);
          reject(error);
        }
      };

      const watcher = startWatch(fixture.config, onBuild);

      setTimeout(async () => {
        if (!callbackCalled && !settled) {
          settled = true;
          watcher.close();
          await cleanupFixture(fixture.rootDir);
          reject(new Error('Callback was not called after 8 seconds'));
        }
      }, 8000);
    });
  });

  test('should work with custom configuration', async () => {
    const fixture = await createWatchFixture();
    const watcher = startWatch(fixture.config);

    try {
      assert.strictEqual(typeof watcher, 'object');
      assert.strictEqual(typeof watcher.close, 'function');
    } finally {
      watcher.close();
      await cleanupFixture(fixture.rootDir);
    }
  });
});
